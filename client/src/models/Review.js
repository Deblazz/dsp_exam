import dayjs from 'dayjs';


/**
 * Constructor function for new Review objects
*/
function Review({ filmId, reviewerId, completed, reviewDate, rating, review, coreviewerId, drafts, self } = {}) {

    this.filmId = filmId;
    this.reviewerId = reviewerId;
    this.completed = completed;

    if (reviewDate) {
        this.reviewDate = dayjs(reviewDate);
    }
    if (typeof rating === 'number' && rating >= 0 && rating <= 10) {
        this.rating = parseInt(rating);
    }
    if (review)
        this.review = review;
    if (coreviewerId)
        this.coreviewerId = coreviewerId;
    if (drafts)
        this.drafts = drafts;
    if (self)
        this.self = self;
}

export { Review }
