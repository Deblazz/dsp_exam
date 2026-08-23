'use strict';
const serviceUtils = require('../utils/serviceUtils.js');
const db = require('../components/db');
const Review = require('../components/review');

var WebSocket = require('../components/websocket');
const WSMessage = require('../components/ws_message');

const mqtt = require('../components/mqtt');
const MQTTMessage = require('../components/mqtt_message');

/**
 * Retrieve the list of all the reviews that have been issued/completed for a public film
 * All the reviews that have been issued/completed for the public film with ID filmId are retrieved. A pagination mechanism is used to limit the size of messages. This operation does not require authentication. 
 *
 * filmId Long ID of the film whose reviews must be retrieved
 * pageNo Integer ID of the requested page (if absent, the first page is returned)' (optional)
 * returns Reviews
 **/
exports.getFilmReviews = function (pageNo, filmId) {
  return new Promise((resolve, reject) => {
    var sql = "SELECT r.filmId as fid, r.reviewerId as rid, completed, reviewDate, rating, review, r.coreviewerId, c.total_rows FROM reviews r, (SELECT count(*) total_rows FROM reviews l WHERE l.filmId = ? ) c WHERE  r.filmId = ? ";
    var params = serviceUtils.getReviewPagination(pageNo, filmId);
    if (params.length != 2) sql = sql + " LIMIT ?,?";
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        let reviews = rows.map((row) => serviceUtils.createReview(row));
        resolve(reviews);
      }
    });
  });
}

/**
* Retrieve the number of reviews of the film with ID filmId
* 
* Input: 
* - filmId: the ID of the film whose reviews need to be retrieved
* Output:
* - total number of reviews of the film with ID filmId
* 
**/
exports.getFilmReviewsTotal = function (filmId) {
  return new Promise((resolve, reject) => {
    var sqlNumOfReviews = "SELECT count(*) total FROM reviews WHERE filmId = ? ";
    db.get(sqlNumOfReviews, [filmId], (err, size) => {
      if (err) {
        reject(err);
      } else {
        resolve(size.total);
      }
    });
  });
}


/**
 * Issue film review to some users
 * The film with ID filmId is assigned to one or more users for review and the corresponding reviews are created. The users are specified in the review representations in the request body. This operation can only be performed by the owner.
 *
 * body List the new film reviews, including the users to whom they are issued
 * filmId Long ID of the film
 * returns List
 **/
exports.issueFilmReview = function (invitations, owner) {
  return new Promise((resolve, reject) => {
    const sql1 = "SELECT owner, private FROM films WHERE id = ?";
    db.all(sql1, [invitations[0].filmId], (err, rows) => {
      if (err) {
        reject(err);
      }
      else if (rows.length === 0) {
        reject("NO_FILMS");
      }
      else if (owner != rows[0].owner) {
        reject("USER_NOT_OWNER");
      } else if (rows[0].private == 1) {
        reject("PRIVATE_FILM");
      }
      else {
        var sql2 = 'SELECT * FROM users';
        var invitedUsers = [];
        for (var i = 0; i < invitations.length; i++) {
          if (i == 0) sql2 += ' WHERE id = ?';
          else sql2 += ' OR id = ?'
          invitedUsers[i] = invitations[i].reviewerId;
        }
        db.all(sql2, invitedUsers, async function (err, rows) {
          if (err) {
            reject(err);
          }
          else if (rows.length !== invitations.length) {
            reject("REVIEWER_ID_IS_NOT_USER");
          }
          else {
            const sql3 = 'INSERT INTO reviews(filmId, reviewerId, completed) VALUES(?,?,0)';
            var finalResult = [];
            for (var i = 0; i < invitations.length; i++) {
              var singleResult;
              try {
                singleResult = await issueSingleReview(sql3, invitations[i].filmId, invitations[i].reviewerId);
                finalResult[i] = singleResult;
              } catch (error) {
                if (error === "EXISTING_REVIEW") {
                  reject("EXISTING_REVIEW");
                  return;
                }
                reject('Error in the creation of the review data structure');
                break;
              }
            }

            if (finalResult.length !== 0) {
              resolve(finalResult);
            }
          }
        });
      }
    });
  });
}

const issueSingleReview = function (sql3, filmId, reviewerId) {
  return new Promise((resolve, reject) => {
    db.run(sql3, [filmId, reviewerId], function (err) {
      if (err) {
        if (err.code === "SQLITE_CONSTRAINT" && err.message.includes("UNIQUE constraint failed")) {

          reject("EXISTING_REVIEW");
        } else {
          reject(err);
        }
      } else {
        var createdReview = new Review(filmId, reviewerId, false);
        resolve(createdReview);
      }
    });
  })
}


/**
 * Delete a review invitation
 * The review of the film with ID filmId and issued to the user with ID reviewerId is deleted. This operation can only be performed by the owner, and only if the review has not yet been completed by the reviewer.
 *
 * filmId Long ID of the film whose review invitation must be deleted
 * reviewerId Long ID of the user to whom the review has been issued
 * no response value expected for this operation
 **/
exports.deleteSingleReview = function (filmId, reviewerId, owner) {
  return new Promise((resolve, reject) => {
    const sql1 = "SELECT f.owner, r.completed FROM films f, reviews r WHERE f.id = r.filmId AND f.id = ? AND r.reviewerId = ?";
    db.all(sql1, [filmId, reviewerId], (err, rows) => {
      if (err)
        reject(err);
      else if (rows.length === 0)
        reject("NO_REVIEWS");
      else if (owner != rows[0].owner) {
        reject("USER_NOT_OWNER");
      }
      else if (rows[0].completed == 1) {
        reject("ALREADY_COMPLETED");
      }
      else {
        const sql2 = 'DELETE FROM reviews WHERE filmId = ? AND reviewerId = ?';
        db.run(sql2, [filmId, reviewerId], (err) => {
          if (err)
            reject(err);
          else
            resolve(null);
        })
      }
    });
  });

}


/**
 * Retrieve a review that has been issued/completed for a film
 * The review of the film with ID filmID issued to the user with ID reviewerId is retrieved. This operation does not require authentication. 
 *
 * filmId Long ID of the film whose reviews must be retrieved
 * reviewerId Long ID of the user to whom the review has been issued
 * returns Review
 **/
exports.getSingleReview = function (filmId, reviewerId) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT filmId as fid, reviewerId as rid, completed, reviewDate, rating, coreviewerId, review FROM reviews WHERE filmId = ? AND reviewerId = ?";
    db.all(sql, [filmId, reviewerId], (err, rows) => {
      if (err)
        reject(err);
      else if (rows.length === 0)
        reject("NO_REVIEWS");
      else {
        var review = serviceUtils.createReview(rows[0]);
        resolve(review);
      }
    });
  });
}



/**
 * Complete a review
 * The review of the film with ID filmId and issued to the user with ID reviewerId is completed. This operation only allows setting the \"completed\" property to the \"true\" value, and changing the values of the \"reviewDate\", \"rating\", and \"review\" properties. This operation can be performed only by the invited reviewer.
 *
 * body Review The updated Review object (optional)
 * filmId Long ID of the film whose review must be completed
 * reviewerId Long ID of the user to whom the review has been issued
 * no response value expected for this operation
 **/
exports.completeSingleReview = function (review, filmId, reviewerId) {
  return new Promise((resolve, reject) => {

    const sql1 = "SELECT * FROM reviews WHERE filmId = ? AND reviewerId = ?";
    db.all(sql1, [filmId, reviewerId], (err, rows) => {
      if (err)
        reject(err);
      else if (rows.length === 0)
        reject("NO_REVIEWS");
      else if (reviewerId != rows[0].reviewerId) {
        reject("USER_NOT_REVIEWER");
      }
      else if (rows[0].coreviewerId) {
        const sql2 = "SELECT * FROM drafts WHERE filmId = ? AND reviewerId = ? ORDER BY version DESC LIMIT 1";
        db.all(sql2, [filmId, reviewerId], (err, draftRows) => {
          if (err)
            reject(err);
          else
            persistReviewCompletion(review, filmId, reviewerId, draftRows[0].text, resolve, reject);
        });
      }
      else if (review.review == undefined) {
        reject("REVIEW_TEXT_REQUIRED");
      }
      else {
        persistReviewCompletion(review, filmId, reviewerId, review.review, resolve, reject);
      }
    });
  });
}

const persistReviewCompletion = function (review, filmId, reviewerId, text, resolve, reject) {
  var sql = 'UPDATE reviews SET completed = ?';
  var parameters = [review.completed];
  if (review.reviewDate != undefined) {
    sql = sql.concat(', reviewDate = ?');
    parameters.push(review.reviewDate);
  }
  if (review.rating != undefined) {
    sql = sql.concat(', rating = ?');
    parameters.push(review.rating);
  }
  if (text != undefined) {
    sql = sql.concat(', review = ?');
    parameters.push(text);
  }
  sql = sql.concat(' WHERE filmId = ? AND reviewerId = ?');
  parameters.push(filmId);
  parameters.push(reviewerId);

  db.run(sql, parameters, function (err) {
    if (err) {
      reject(err);
    } else {
      resolve(null);
    }
  });
}


/**
 * Select a film as the active film
 *
 * Input: 
 * - userId: ID of the user who wants to select the task
 * - filmId: ID of the film to be selected
 * Output:
 * - no response expected for this operation
 * 
 **/
exports.selectActiveFilm = function selectActiveFilm(userId, filmId) {
  return new Promise((resolve, reject) => {
    db.serialize(function () {
      db.run('BEGIN TRANSACTION;');
      const sql1 = 'SELECT f.id FROM films as f WHERE f.id = ? AND f.private = 0';
      db.all(sql1, [filmId], function (err, check) {
        if (err) {
          db.run('ROLLBACK;')
          reject(err);
        }
        else if (check.length == 0) {
          db.run('ROLLBACK;')
          reject(409);
        }
        else {
          // find if previously selected film exists
          const sql2 = 'SELECT f.id FROM reviews as r, films as f WHERE r.reviewerId = ? AND r.filmId = f.id AND r.active = 1';
          db.all(sql2, [userId], function (err, rows1) {
            if (err) {
              db.run('ROLLBACK;')
              reject(err);
            } else {
              var deselected = null;
              if (rows1.length !== 0) {
                deselected = rows1[0].id;
              }
              const sql3 = 'SELECT u.name, f.title FROM reviews as r, users as u, films as f WHERE r.reviewerId = ? AND r.filmId = ? AND r.reviewerId = u.id AND r.filmId = f.id';
              db.all(sql3, [userId, filmId], function (err, rows2) {
                if (err) {
                  db.run('ROLLBACK;')
                  reject(err);
                } else {
                  const sql4 = 'UPDATE reviews SET active = 0 WHERE reviewerId = ?';
                  db.run(sql4, [userId], function (err) {
                    if (err) {
                      db.run('ROLLBACK;')
                      reject(err);
                    } else {
                      const sql5 = 'UPDATE reviews SET active = 1 WHERE reviewerId = ? AND filmId = ? AND NOT EXISTS (SELECT * FROM reviews WHERE reviewerId <> ? AND filmId = ? AND active = 1)';
                      db.run(sql5, [userId, filmId, userId, filmId], function (err) {
                        if (err) {
                          db.run('ROLLBACK;')
                          reject(err);
                        } else if (this.changes == 0) {
                          db.run('ROLLBACK;')
                          reject(403);
                        } else {
                          db.run('COMMIT TRANSACTION');
                          console.log("User " + userId + " selected active film " + filmId + ". Detected deselection operation:" + deselected);
                          // publish MQTT message to inform clients about the change (selected film)
                          var mqttMessage = new MQTTMessage('active', parseInt(userId), rows2[0].name);
                          mqtt.publishFilmMessage(filmId, mqttMessage);

                          // publish MQTT message to inform clients about the change (previously selected film)
                          if (deselected) {
                            var mqttMessage2 = new MQTTMessage("inactive", null, null);
                            mqtt.publishFilmMessage(deselected, mqttMessage2);
                          }

                          //inform the clients that the user selected a different task where they are working on
                          var updateMessage = new WSMessage('update', parseInt(userId), rows2[0].name, parseInt(filmId), rows2[0].title);
                          WebSocket.sendAllClients(updateMessage);
                          WebSocket.saveMessage(userId, new WSMessage('login', parseInt(userId), rows2[0].name, parseInt(filmId), rows2[0].title));
                          resolve();
                        }
                      })
                    }
                  })
                }
              })
            }
          })
        }
      })
    });
  });
}

/**
 * Appoint a coreviewer for a review
 *
 * Input: 
 * - filmId: ID of the film whose review must be updated
 * - reviewerId: ID of the user to whom the review has been issued
 * - coreviewerId: ID of the user to appoint as coreviewer
 * Output:
 * - the updated review with the appointed coreviewer
 * 
 **/
exports.appointCoreviewer = function (filmId, reviewerId, coreviewerId) {
  return new Promise((resolve, reject) => {
    const sql1 = "SELECT * FROM reviews WHERE filmId = ? AND reviewerId = ?";
    db.all(sql1, [filmId, reviewerId], (err, rows) => {
      if (err)
        reject(err);
      else if (rows.length === 0)
        reject("NO_REVIEWS");
      else if (rows[0].completed)
        reject("REVIEW_ALREADY_COMPLETED");
      else if (rows[0].coreviewerId != null)
        reject("COREVIEWER_ALREADY_ASSIGNED");
      else {
        const sql2 = "SELECT * FROM users WHERE id = ?";
        db.all(sql2, [coreviewerId], (err, rows) => {
          if (err)
            reject(err);
          else if (rows.length === 0)
            reject("NO_COREVIEWER");
          else {
            // Update the record appointing a coreviewer
            const sql3 = "UPDATE reviews SET coreviewerId = ? WHERE filmId = ? AND reviewerId = ?";
            db.run(sql3, [coreviewerId, filmId, reviewerId], function (err) {
              if (err)
                reject(err);
              else {
                // Create a new empty draft for a review when a new coreviewer is appointed
                const sql4 = "INSERT INTO drafts (filmId, reviewerId, version, text, userRole) VALUES (?, ?, 0, '', 'initialDraft')";
                db.run(sql4, [filmId, reviewerId], function (err) {
                  if (err)
                    reject(err);
                  else {
                    exports.getSingleReview(filmId, reviewerId).then((review) => {
                      resolve(review);
                    }).catch((err) => {
                      reject(err);
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  });
}

/**
 * Retrieve the list of all the drafts that have been submitted for a review
 * Input: 
 * - filmId: ID of the film whose reviews must be retrieved
 * - reviewerId: ID of the user who submitted the review
 * - userId: ID of the user making the request
 * Output:
 * - the list of all drafts for the specified review
 */
exports.getReviewDrafts = function (filmId, reviewerId, userId) {
  return new Promise((resolve, reject) => {
    const sql1 = "SELECT * FROM reviews WHERE filmId = ? AND reviewerId = ?";
    db.all(sql1, [filmId, reviewerId], (err, rows) => {
      if (err)
        reject(err);
      else if (rows.length === 0)
        reject("NO_REVIEWS");
      else if (userId != rows[0].reviewerId && userId != rows[0].coreviewerId) {
        reject("USER_NOT_REVIEWER_OR_COREVIEWER");
      }
      else if (rows[0].coreviewerId == null) {
        reject("NO_COREVIEWER_APPOINTED");
      }
      else {
        const sql2 = "SELECT * FROM drafts WHERE filmId = ? AND reviewerId = ?";
        db.all(sql2, [filmId, reviewerId], (err, rows) => {
          if (err)
            reject(err);
          else {
            resolve(rows);
          }
        });
      }
    });
  });
}

/**
 *  Get the current draft of a review
 * Input: 
 * - filmId: ID of the film whose reviews must be retrieved
 * - reviewerId: ID of the user who submitted the review
 * - userId: ID of the user making the request
 * Output:
 * - the current draft for the specified review
 */
exports.getCurrentReviewDraft = function (filmId, reviewerId, userId) {
  return new Promise((resolve, reject) => {
    const sql1 = "SELECT * FROM reviews WHERE filmId = ? AND reviewerId = ?";
    db.all(sql1, [filmId, reviewerId], (err, rows) => {
      if (err)
        reject(err);
      else if (rows.length === 0)
        reject("NO_REVIEWS");
      else if (userId != rows[0].reviewerId && userId != rows[0].coreviewerId) {
        reject("USER_NOT_REVIEWER_OR_COREVIEWER");
      }
      else if (rows[0].coreviewerId == null) {
        reject("NO_COREVIEWER_APPOINTED");
      }
      else {
        const sql2 = "SELECT * FROM drafts WHERE filmId = ? AND reviewerId = ? ORDER BY version DESC LIMIT 1";
        db.all(sql2, [filmId, reviewerId], (err, rows) => {
          if (err)
            reject(err);
          else {
            resolve(rows[0]);
          }
        });
      }
    });
  });
}

/**
 *  Submit a new review draft
 * Input:
 * - filmId: ID of the film whose reviews must be retrieved
 * - reviewerId: ID of the user who submitted the review
 * - userId: ID of the user making the request
 * - body: the draft content
 * Output:
 * - the submitted draft
 */
exports.submitReviewDraft = function (filmId, reviewerId, userId, body) {
  return new Promise((resolve, reject) => {
    const sql1 = "SELECT * FROM reviews WHERE filmId = ? AND reviewerId = ?";
    db.all(sql1, [filmId, reviewerId], (err, rows) => {
      if (err)
        reject(err);
      else if (rows.length === 0)
        reject("NO_REVIEWS");
      else if (rows[0].completed)
        reject("REVIEW_ALREADY_COMPLETED");
      else if (userId != rows[0].reviewerId && userId != rows[0].coreviewerId) {
        reject("USER_NOT_REVIEWER_OR_COREVIEWER");
      }
      else if (rows[0].coreviewerId == null) {
        reject("NO_COREVIEWER_APPOINTED");
      }
      else {
        const userRole = (userId == rows[0].reviewerId) ? 'reviewer' : 'coreviewer';
        const sql2 = "SELECT MAX(version) as currentVersion FROM drafts WHERE filmId = ? AND reviewerId = ?";
        db.get(sql2, [filmId, reviewerId], (err, row) => {
          if (err)
            reject(err);
          else if (body.version !== row.currentVersion + 1) {
            reject("VERSION_CONFLICT");
          }
          else {
            const sql3 = "INSERT INTO drafts (filmId, reviewerId, version, text, userRole) VALUES (?, ?, ?, ?, ?)";
            db.run(sql3, [filmId, reviewerId, body.version, body.text, userRole], function (err) {
              if (err) {
                if (err.code === "SQLITE_CONSTRAINT" && err.message.includes("UNIQUE constraint failed")) {
                  reject("VERSION_CONFLICT");
                } else {
                  reject(err);
                }
              }
              else {
                resolve({ filmId: filmId, reviewerId: reviewerId, version: body.version, text: body.text, userRole: userRole });
              }
            });
          }
        });
      }
    });
  });
}