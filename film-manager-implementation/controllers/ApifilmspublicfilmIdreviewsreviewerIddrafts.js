'use strict';

var utils = require('../utils/writer.js');
const reviewService = require('../service/ReviewsService.js');

module.exports.getReviewDrafts = function getReviewDrafts(req, res, next) {
    reviewService.getReviewDrafts(req.params.filmId, req.params.reviewerId, req.user.id)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            if (response == "NO_REVIEWS") {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review does not exist.' }], }, 404);
            }
            else if (response == "USER_NOT_REVIEWER_OR_COREVIEWER") {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The requesting user is neither the reviewer nor the co-reviewer of the review.' }], }, 403);
            }
            else if (response == "NO_COREVIEWER_APPOINTED") {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review does not have a co-reviewer appointed.' }], }, 409);
            }
            else {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
            }
        });
};

module.exports.submitReviewDraft = function postReviewDraft(req, res, next) {
    if (req.body.version == undefined || req.body.text == undefined) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'Missing required fields.' }], }, 400);
        return;
    }
    reviewService.submitReviewDraft(req.params.filmId, req.params.reviewerId, req.user.id, req.body)
        .then(function (response) {
            utils.writeJson(res, response, 201);
        })
        .catch(function (response) {
            if (response == "NO_REVIEWS") {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review does not exist.' }], }, 404);
            }
            else if (response == "REVIEW_ALREADY_COMPLETED") {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'Cannot submit a draft for an already completed review' }] }, 409);
            }
            else if (response == "USER_NOT_REVIEWER_OR_COREVIEWER") {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The requesting user is neither the reviewer nor the co-reviewer of the review.' }], }, 403);
            }
            else if (response == "NO_COREVIEWER_APPOINTED") {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review does not have a co-reviewer appointed.' }], }, 409);
            }
            else if (response == "VERSION_CONFLICT") {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The submitted version does not match the expected next version.' }], }, 409);
            }
            else {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
            }
        });
};