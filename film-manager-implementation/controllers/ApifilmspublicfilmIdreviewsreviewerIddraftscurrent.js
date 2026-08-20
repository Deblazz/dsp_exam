'use strict';

var utils = require('../utils/writer.js');
const reviewService = require('../service/ReviewsService.js');

module.exports.getCurrentReviewDraft = function getCurrentReviewDraft(req, res, next) {
    reviewService.getCurrentReviewDraft(req.params.filmId, req.params.reviewerId, req.user.id)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            if (response == "NO_REVIEWS") {
                utils.writeJson(res, {errors: [{'param': 'Server', 'msg': 'The review does not exist.'}],}, 404);
            }
            else if (response == "USER_NOT_REVIEWER_OR_COREVIEWER") {
                utils.writeJson(res, {errors: [{'param': 'Server', 'msg': 'The requesting user is neither the reviewer nor the co-reviewer of the review.'}],}, 403);
            }
            else if (response == "NO_COREVIEWER_APPOINTED") {
                utils.writeJson(res, {errors: [{'param': 'Server', 'msg': 'The review does not have a co-reviewer appointed.'}],}, 409);
            }
            else {
                utils.writeJson(res, {errors: [{'param': 'Server', 'msg': response}],}, 500);
            }
        });
};
