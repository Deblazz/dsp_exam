'use strict';

var utils = require('../utils/writer.js');
const reviewService = require('../service/ReviewsService.js');

module.exports.issueFilmCoreview = function issueFilmCoreview (req, res, next) {

  if (req.params.reviewerId != req.user.id) {
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The reviewerId is not equal the id of the requesting user.' }], }, 403);
  }
  else if (req.body.coreviewerId == undefined) {
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The coreviewerId property is absent.' }], }, 400);
  }
  else if (req.body.coreviewerId == req.params.reviewerId) {
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The coreviewerId cannot be equal to the reviewerId.' }], }, 409);
  }
  else {
    reviewService.appointCoreviewer(req.params.filmId, req.params.reviewerId, req.body.coreviewerId)
      .then(function (response) {
        utils.writeJson(res, response, 201);
      })
      .catch(function (response) {
        if (response == "NO_REVIEWS") {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review does not exist.' }], }, 404);
        }
        else if (response == "REVIEW_ALREADY_COMPLETED") {
          utils.writeJson(res, {errors: [{'param': 'Server', 'msg': 'Cannot assign a coreviewer to an already completed review.'}]}, 409);
        }
        else if (response == "NO_COREVIEWER") {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user with ID coreviewerId does not exist.' }], }, 404);
        }
        else if (response == "COREVIEWER_ALREADY_ASSIGNED") {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'A co-reviewer has already been appointed for this review.' }], }, 409);
        }
        else {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
        }
      });
  }
};
