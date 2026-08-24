class Film{    
    constructor(id, title, owner, privateFilm, watchDate, rating, favorite, reviewerId){
        if(id)
            this.id = id;

        this.title = title;
        this.owner = owner;
        this.private = privateFilm;

        if(watchDate)
            this.watchDate = watchDate;
        if(rating)
            this.rating = rating;
        if(favorite)
            this.favorite = favorite;
        if(reviewerId)
            this.reviewerId = reviewerId;

        this.self =  (privateFilm? "/api/films/private/" + this.id : "/api/films/public/" + this.id);

        if(this.private == false)
            this.reviews = "/api/films/public/" + this.id + "/reviews";
    }
}

module.exports = Film;