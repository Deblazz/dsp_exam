import React, { useState, useEffect, useContext } from 'react';
import { Row, Col, Button, Toast } from 'react-bootstrap';
import { Link, useParams, useLocation, Outlet, Navigate } from 'react-router-dom';

import PrivateFilmForm from './PrivateFilmForm';
import PublicFilmForm from './PublicFilmForm';
import ReviewForm from './ReviewForm';
import CoreviewForm from './CoreviewForm';
import AssignCoreviewerForm from './AssignCoreviewerForm';
import PrivateFilmTable from './PrivateFilmLibrary';
import PublicFilmTable from './PublicFilmLibrary';
import FilmToReviewTable from './FilmToReviewLibrary';
import FilmToCoreviewTable from './FilmToCoreviewLibrary';
import FilmReviewTable from './FilmReviewLibrary';
import IssueReviewTable from './IssueReviewLibrary';
import { LoginForm } from './Auth';
import { RouteFilters } from './Filters';

import MessageContext from '../messageCtx';
import API from '../API';

import OnlineList from './OnlineList';
import MiniOnlineList from './MiniOnlineList';

/**
 * Except when we are waiting for the data from the server, this layout is always rendered.
 * <Outlet /> component is replaced according to which route is matching the URL.
 */
function DefaultLayout(props) {

  const location = useLocation();

  var filterId = false;
  if (location.pathname == "/private") {
    filterId = "private";
  } else if (location.pathname == "/public") {
    filterId = "public";
  } else if (location.pathname == "/public/to_review") {
    filterId = "public/to_review";
  } else if (location.pathname == "/public/to_coreview") {
    filterId = "public/to_coreview";
  } else if (location.pathname == "/online") {
    filterId = "online";
  }

  return (
    <Row className="vh-100">
      <Col md={4} bg="light" className="below-nav" id="left-sidebar">
        <RouteFilters items={props.filters} selected={filterId} />
        <MiniOnlineList onlineList={props.onlineList} />
      </Col>
      <Col md={8} className="below-nav">
        <Outlet />
      </Col>
    </Row>
  );

}

function PrivateLayout(props) {

  const [films, setFilms] = useState([]);
  const [dirty, setDirty] = useState(true);

  const location = useLocation();

  const { handleErrors } = useContext(MessageContext);


  const { filterLabel } = useParams();
  const filterId = filterLabel || (location.pathname === "/" && 'filter-all');

  useEffect(() => {
    setDirty(true);
  }, [filterId])

  useEffect(() => {
    if (dirty) {
      API.getPrivateFilms(props.filmManager)
        .then(films => {
          setFilms(films);
          setDirty(false);
        })
        .catch(e => handleErrors(e));
    }
  }, [dirty]);

  const deleteFilm = (film) => {
    API.deleteFilm(film)
      .then(() => { setDirty(true); })
      .catch(e => {
        const msg = e.errObj && e.errObj.errors && e.errObj.errors[0] && e.errObj.errors[0].msg;
        handleErrors(msg || e);
      });
  }

  const updateFilm = (film) => {
    API.updateFilm(film)
      .then(() => { setDirty(true); })
      .catch(e => {
        const msg = e.errObj && e.errObj.errors && e.errObj.errors[0] && e.errObj.errors[0].msg;
        handleErrors(msg || e);
      });
  }

  const refreshFilms = pageNumber => {
    API.getPrivateFilms(props.filmManager, pageNumber)
      .then(films => {
        setFilms(films);
        setDirty(false);
      })
      .catch(e => handleErrors(e));
  }



  return (
    <>
      <h1 className="pb-3">Private Films</h1>
      <PrivateFilmTable films={films}
        deleteFilm={deleteFilm} updateFilm={updateFilm} refreshFilms={refreshFilms} />
      <Link to="/private/add" state={{ nextpage: location.pathname }}>
        <Button variant="primary" size="lg" className="fixed-right-bottom" > &#43; </Button>
      </Link>
    </>
  )
}

function AddPrivateLayout(props) {

  const { handleErrors } = useContext(MessageContext);

  const addFilm = (filmManager, film) => {
    return API.addFilm(filmManager, film)
      .catch(e => { handleErrors(e); throw e; });
  }
  return (
    <PrivateFilmForm filmManager={props.filmManager} addFilm={addFilm} />
  );
}

function EditPrivateLayout() {

  const { handleErrors } = useContext(MessageContext);

  const { filmId } = useParams();
  const [film, setFilm] = useState(null);

  const location = useLocation();

  if (location.state == null)
    return <Navigate replace to='/*' />

  useEffect(() => {
    API.getFilm(location.state[0].film)
      .then(film => {
        if (film.owner == parseInt(sessionStorage.getItem('userId')))
          setFilm(film);
      })
      .catch(e => {
        handleErrors(e);
      });
  }, [filmId]);

  const editFilm = (film) => {
    return API.updateFilm(film)
      .catch(e => { handleErrors(e); throw e; });
  }

  return (
    film ? <PrivateFilmForm film={film} editFilm={editFilm} /> : <><h4 className="pb-3">This task cannot be modified or it does not exists.</h4></>
  );
}

function PublicLayout(props) {

  const [films, setFilms] = useState([]);
  const [dirty, setDirty] = useState(true);

  const location = useLocation();

  const { handleErrors } = useContext(MessageContext);


  const { filterLabel } = useParams();
  const filterId = filterLabel || (location.pathname === "/" && 'filter-all');

  useEffect(() => {
    setDirty(true);
  }, [filterId])


  useEffect(() => {
    if (dirty) {
      API.getPublicFilms(props.filmManager)
        .then(films => {
          setFilms(films);
          setDirty(false);
        })
        .catch(e => { handleErrors(e); });
    }
  }, [dirty]);

  const deleteFilm = (film) => {
    API.deleteFilm(film)
      .then(() => { setDirty(true); })
      .catch(e => {
        const msg = e.errObj && e.errObj.errors && e.errObj.errors[0] && e.errObj.errors[0].msg;
        handleErrors(msg || e);
      });
  }

  const updateFilm = (film) => {
    API.updateFilm(film)
      .then(() => { setDirty(true); })
      .catch(e => {
        const msg = e.errObj && e.errObj.errors && e.errObj.errors[0] && e.errObj.errors[0].msg;
        handleErrors(msg || e);
      });
  }

  const refreshFilms = pageNumber => {
    API.getPublicFilms(props.filmManager, pageNumber)
      .then(films => {
        setFilms(films);
        setDirty(false);
      })
      .catch(e => handleErrors(e));
  }

  return (
    <>
      <h1 className="pb-3">Public Films</h1>
      <PublicFilmTable films={films}
        deleteFilm={deleteFilm} updateFilm={updateFilm} refreshFilms={refreshFilms} />
      <Link to="/public/add" state={{ nextpage: location.pathname }}>
        <Button variant="primary" size="lg" className="fixed-right-bottom" > &#43; </Button>
      </Link>
    </>
  )
}

function PublicToReviewLayout(props) {

  const [films, setFilms] = useState([]);
  const [dirty, setDirty] = useState(true);

  const location = useLocation();

  const { handleErrors } = useContext(MessageContext);


  const { filterLabel } = useParams();
  const filterId = filterLabel || (location.pathname === "/" && 'filter-all');


  useEffect(() => {
    setDirty(true);
  }, [filterId])


  useEffect(() => {
    if (dirty) {
      API.getPublicFilmsToReview(props.filmManager)
        .then(films => {
          for (var i = 0; i < films.length; i++) {
            var tmpArray = props.subscribedTopics.slice();
            var included = false;
            for (var j = 0; j < tmpArray.length; j++) {
              if (tmpArray[j] == parseInt(films[i].id)) {
                included = true;
              }
            }
            if (!included) {
              // Client not already subscribed to this topic
              props.mqttClient.subscribe(String(films[i].id), { qos: 0, retain: true });
              tmpArray.push(parseInt(films[i].id));
              props.setSubscribedTopics(tmpArray);
            }
          }
          setFilms(films);
          setDirty(false);
        })
        .catch(e => { handleErrors(e); });
    }
  }, [dirty]);

  const deleteFilm = (film) => {
    API.deleteFilm(film)
      .then(() => { setDirty(true); })
      .catch(e => {
        const msg = e.errObj && e.errObj.errors && e.errObj.errors[0] && e.errObj.errors[0].msg;
        handleErrors(msg || e);
      });
  }

  const updateFilm = (film) => {
    API.updateFilm(film)
      .then(() => { setDirty(true); })
      .catch(e => {
        const msg = e.errObj && e.errObj.errors && e.errObj.errors[0] && e.errObj.errors[0].msg;
        handleErrors(msg || e);
      });
  }

  const selectFilm = (film, user) => {
    console.log("Selecting film " + film.id + " for user " + user.id);
    API.selectFilm(film, user)
      .then(() => { setDirty(true); })
      .catch(e => { alert('Film is already active for another user!'); });
  }

  const refreshFilms = pageNumber => {
    API.getPublicFilmsToReview(props.filmManager, pageNumber)
      .then(films => {
        for (var i = 0; i < films.length; i++) {
          var tmpArray = props.subscribedTopics.slice();
          var included = false;
          for (var j = 0; j < tmpArray.length; j++) {
            if (tmpArray[j] == parseInt(films[i].id)) {
              included = true;
            }
          }
          if (!included) {
            // Client not already subscribed to this topic
            props.mqttClient.subscribe(String(films[i].id), { qos: 0, retain: true });
            tmpArray.push(parseInt(films[i].id));
            props.setSubscribedTopics(tmpArray);
          }
        }
        setFilms(films);
        setDirty(false);
      })
      .catch(e => handleErrors(e));
  }

  return (
    <>
      <h1 className="pb-3">Public Films to review</h1>
      <FilmToReviewTable films={films}
        deleteFilm={deleteFilm} updateFilm={updateFilm} refreshFilms={refreshFilms} selectFilm={selectFilm} onlineList={props.onlineList} user={props.user} filmSelections={props.filmSelections} />
    </>
  )
}

function AddPublicLayout(props) {

  const { handleErrors } = useContext(MessageContext);

  const addFilm = (filmManager, film) => {
    return API.addFilm(filmManager, film)
      .catch(e => { handleErrors(e); throw e; });
  }
  return (
    <PublicFilmForm filmManager={props.filmManager} addFilm={addFilm} />
  );
}

function EditPublicLayout() {

  const { handleErrors } = useContext(MessageContext);

  const { filmId } = useParams();
  const [film, setFilm] = useState(null);

  const location = useLocation();

  if (location.state == null)
    return <Navigate replace to='/*' />

  useEffect(() => {
    API.getFilm(location.state[0].film)
      .then(film => {
        if (film.owner == parseInt(sessionStorage.getItem('userId')))
          setFilm(film);
      })
      .catch(e => {
        handleErrors(e);
      });
  }, [filmId]);

  const editFilm = (film) => {
    return API.updateFilm(film)
      .catch(e => { handleErrors(e); throw e; });
  }



  return (
    film ? <PublicFilmForm film={film} editFilm={editFilm} /> : <><h4 className="pb-3">This task cannot be modified or it does not exists.</h4></>
  );
}


function ReviewLayout() {

  const [reviews, setReviews] = useState([]);
  const [dirty, setDirty] = useState(true);
  const [film, setFilm] = useState()
  const { filmId } = useParams();

  const location = useLocation();

  const { handleErrors } = useContext(MessageContext);


  const { filterLabel } = useParams();
  const filterId = filterLabel || (location.pathname === "/" && 'filter-all');

  if (location.state == null)
    return <Navigate replace to='/*' />

  useEffect(() => {
    setDirty(true);
  }, [filterId])


  useEffect(() => {
    if (dirty) {
      API.getFilm(location.state[0].film).then(filmObj => {
        setFilm(filmObj)
        API.getFilmReviews(location.state[0].film)
          .then(reviews => {
            setReviews(reviews);
            setDirty(false);
          })

      })
        .catch(e => { handleErrors(e); });
    }
  }, [dirty]);

  const deleteReview = (review) => {
    API.deleteReview(review)
      .then(() => { setDirty(true); })
      .catch(e => {
        const msg = e.errObj && e.errObj.errors && e.errObj.errors[0] && e.errObj.errors[0].msg;
        handleErrors(msg || e);
      });
  }

  const updateReview = (review) => {
    API.updateReview(review)
      .then(() => { setDirty(true); })
      .catch(e => {
        const msg = e.errObj && e.errObj.errors && e.errObj.errors[0] && e.errObj.errors[0].msg;
        handleErrors(msg || e);
      });
  }

  const refreshReviews = (film, pageNumber) => {
    API.getFilmReviews(film, pageNumber)
      .then(review => {
        setReviews(review);
        setDirty(false);
      })
      .catch(e => handleErrors(e));
  }

  return (
    <>
      <h1 className="pb-3">Review for Film with ID {filmId}</h1>
      {film &&
        <h2>Title: {film.title}</h2>
      }
      <FilmReviewTable reviews={reviews} film={film}
        deleteReview={deleteReview} updateReview={updateReview} refreshReviews={refreshReviews} />
    </>
  );
}

function EditReviewLayout(props) {

  const { handleErrors } = useContext(MessageContext);

  const { filmId } = useParams();
  const [review, setReview] = useState(null);
  const [currentDraft, setCurrentDraft] = useState(null);

  const location = useLocation();

  if (location.state == null)
    return <Navigate replace to='/*' />

  useEffect(() => {
    if (!props.mqttClient || !review || !review.coreviewerId) return;

    const topic = `films/${filmId}/reviews/${review.reviewerId}/draft`;
    props.mqttClient.subscribe(topic, { qos: 0, retain: false });

    const onMessage = (receivedTopic, message) => {
      if (receivedTopic !== topic) return;
      const parsedMessage = JSON.parse(message);
      if (parsedMessage.userRole === 'reviewer') return; // echo of our own save, ignore
      alert('A new draft version has been submitted, reloading the text.');
      setCurrentDraft(parsedMessage);
    };

    props.mqttClient.on('message', onMessage);

    return () => {
      props.mqttClient.unsubscribe(topic);
      props.mqttClient.removeListener('message', onMessage);
    };
  }, [filmId, review]);


  useEffect(() => {
    API.getReview(location.state[0].review)
      .then(review => {
        setReview(review);
        if (review.coreviewerId) {
          return API.getCurrentDraft(review);
        }
      })
      .then(draft => {
        if (draft) setCurrentDraft(draft);
      })
      .catch(e => {
        handleErrors(e);
      });
  }, [filmId]);

  const editReview = (review) => {
    API.updateReview(review)
      .catch(e => {
        const msg = e.errObj && e.errObj.errors && e.errObj.errors[0] && e.errObj.errors[0].msg;
        handleErrors(msg || e);
      });
  }


  const submitNewDraft = (text) => {
    return API.submitDraft(review, { ...currentDraft, text })
      .then(newDraft => {
        setCurrentDraft(newDraft);
        return newDraft;
      })
      .catch(e => {
        const msg = e.errors && e.errors[0] && e.errors[0].msg;
        if (msg === 'The submitted version does not match the expected next version.') {
          alert('New version of the draft has been submitted by the co-reviewer. Reloading the latest version.');
          API.getCurrentDraft(review).then(draft => setCurrentDraft(draft));
        } else {
          handleErrors(msg || e);
        }
        throw e;
      });
  }

  return (
    review ? <ReviewForm key={currentDraft ? currentDraft.version : 'no-draft'} review={review} currentDraft={currentDraft} editReview={editReview} submitNewDraft={submitNewDraft} /> : <><h4 className="pb-3">This review cannot be modified or it does not exists.</h4></>
  );
}


function IssueLayout(props) {

  const [dirty, setDirty] = useState(true);
  const [film, setFilm] = useState()
  const [users, setUsers] = useState([]);
  const [issueMessage, setIssueMessage] = useState('');
  const { filmId } = useParams();

  const location = useLocation();

  const { handleErrors } = useContext(MessageContext);


  const { filterLabel } = useParams();
  const filterId = filterLabel || (location.pathname === "/" && 'filter-all');

  if (location.state == null)
    return <Navigate replace to='/*' />

  useEffect(() => {
    setDirty(true);
  }, [filterId])


  useEffect(() => {
    if (dirty) {
      API.getFilm(location.state[0].film).then(filmObj => {
        setFilm(filmObj)
        /*API.getUsers()
        .then(users => {
          setUsers(users);
          setDirty(false);
          })*/

      })
        .catch(e => { handleErrors(e); });
    }
  }, [dirty]);

  const getUsers = (filmManager) => {
    API.getUsers(filmManager)
      .then(users => {
        setUsers(users);
        setDirty(false);
      })
      .catch(e => handleErrors(e));
  }

  const issueReview = (film, user) => {
    API.issueReview(film, user)
      .then(review => {
        setIssueMessage("The review has been successfully issued.")
        setDirty(false);
      })
      .catch(e => { handleErrors(e); });
  }

  return (
    <>
      <h1 className="pb-3">Issue Review for Film with ID {filmId}</h1>
      {film &&
        <h2>Title: {film.title}</h2>
      }
      <IssueReviewTable filmId={filmId} film={location.state[0].film} users={users} getUsers={getUsers} issueReview={issueReview} filmManager={props.filmManager} />
      <Toast show={issueMessage !== ''} onClose={() => setIssueMessage('')} delay={10000} autohide>
        <Toast.Body>{issueMessage}</Toast.Body>
      </Toast>
    </>
  );
}

function AssignCoreviewerLayout(props) {

  const { handleErrors } = useContext(MessageContext);

  const location = useLocation();

  if (location.state == null)
    return <Navigate replace to='/*' />

  const review = location.state[0].review;

  const [users, setUsers] = useState([]);

  useEffect(() => {
    API.getUsers(props.filmManager)
      .then(users => { setUsers(users); })
      .catch(e => handleErrors(e));
  }, []);

  const appointCoreviewer = (coreviewerId) => {
    return API.appointCoreviewer(review, coreviewerId)
      .catch(e => {
        const msg = e.errors && e.errors[0] && e.errors[0].msg;
        handleErrors(msg || e);
        throw e;
      });
  }

  return (
    <>
      <h1 className="pb-3">Assign Coreviewer for Review {review.reviewerId} - Film {review.filmId}</h1>
      <AssignCoreviewerForm review={review} users={users} appointCoreviewer={appointCoreviewer} />
    </>
  );
}


function NotFoundLayout() {
  return (
    <>
      <h2>This is not the route you are looking for!</h2>
      <Link to="/">
        <Button variant="primary">Go Home!</Button>
      </Link>
    </>
  );
}

function LoginLayout(props) {
  return (
    <Row className="vh-100">
      <Col md={12} className="below-nav">
        <LoginForm login={props.login} filmManager={props.filmManager} />
      </Col>
    </Row>
  );
}

/**
 * This layout shuld be rendered while we are waiting a response from the server.
 */
function LoadingLayout(props) {
  return (
    <Row className="vh-100">
      <Col md={4} bg="light" className="below-nav" id="left-sidebar">
      </Col>
      <Col md={8} className="below-nav">
        <h1>Film Manager ...</h1>
      </Col>
    </Row>
  )
}

function OnlineLayout(props) {

  const location = useLocation();

  const { handleErrors } = useContext(MessageContext);
  const { filterLabel } = useParams();
  const filterId = filterLabel || (location.pathname === "/" && 'filter-all');
  var onlineList = props.onlineList;


  useEffect(() => {
    //setDirty(true);
  }, [filterId])


  return (
    <>
      <h1 className="pb-3">Online Users</h1>
      <div className="user">
        <OnlineList usersList={onlineList} />
      </div>
    </>
  )
}

function PublicToCoreviewLayout(props) {

  const [films, setFilms] = useState([]);

  const { handleErrors } = useContext(MessageContext);

  useEffect(() => {
    API.getCoreviewFilms(props.filmManager)
      .then(films => setFilms(films))
      .catch(e => { handleErrors(e); });
  }, []);

  const refreshFilms = pageNumber => {
    API.getCoreviewFilms(props.filmManager, pageNumber)
      .then(films => {
        setFilms(films);
      })
      .catch(e => handleErrors(e));
  }

  return (
    <>
      <h1 className="pb-3">Films to Co-review</h1>
      <FilmToCoreviewTable films={films} refreshFilms={refreshFilms} />
    </>
  )
}

function EditCoreviewLayout(props) {

  const { handleErrors } = useContext(MessageContext);

  const { filmId, reviewerId } = useParams();
  const [review, setReview] = useState(null);
  const [currentDraft, setCurrentDraft] = useState(null);

  useEffect(() => {
    const reviewRef = { self: "/api/films/public/" + filmId + "/reviews/" + reviewerId };
    API.getReview(reviewRef)
      .then(review => {
        setReview(review);
        return API.getCurrentDraft(review);
      })
      .then(draft => {
        setCurrentDraft(draft);
      })
      .catch(e => {
        handleErrors(e);
      });
  }, [filmId, reviewerId]);

  // Subscribe to MQTT topic for draft updates
  useEffect(() => {
    if (!props.mqttClient) return;

    const topic = `films/${filmId}/reviews/${reviewerId}/draft`;

    // Set retain and qos
    props.mqttClient.subscribe(topic, { qos: 0, retain: false });

    // Define the message handler
    const onMessage = (receivedTopic, message) => {
      if (receivedTopic !== topic) return;
      const parsedMessage = JSON.parse(message);
      if (parsedMessage.userRole === 'coreviewer') return; // echo of our own save, ignore
      // Otherwise, alert the user and update the current draft, version coming from the reviewer
      alert('A new draft version has been submitted, reloading the text.');
      setCurrentDraft(parsedMessage);
    };

    props.mqttClient.on('message', onMessage);

    // Cleanup function to unsubscribe and remove the listener when the component unmounts or dependencies change
    return () => {
      props.mqttClient.unsubscribe(topic);
      props.mqttClient.removeListener('message', onMessage);
    };
  }, [filmId, reviewerId]);

  const submitNewDraft = (text) => {
    return API.submitDraft(review, { ...currentDraft, text })
      .then(newDraft => {
        setCurrentDraft(newDraft);
      })
      .catch(e => {
        const msg = e.errors && e.errors[0] && e.errors[0].msg;

        // Version error
        if (msg === 'The submitted version does not match the expected next version.') {
          alert('New version of the draft has been submitted by the reviewer. Reloading the latest version.');
          API.getCurrentDraft(review).then(draft => setCurrentDraft(draft));
        } else {
          handleErrors(msg || e);
        }
        throw e;
      });
  }

  return (
    review && currentDraft ?
      <CoreviewForm key={currentDraft.version} review={review} currentDraft={currentDraft} submitNewDraft={submitNewDraft} />
      : <><h4 className="pb-3">Loading...</h4></>
  );
}




export { DefaultLayout, AddPrivateLayout, EditPrivateLayout, AddPublicLayout, EditPublicLayout, EditReviewLayout, NotFoundLayout, LoginLayout, PrivateLayout, PublicLayout, PublicToReviewLayout, ReviewLayout, IssueLayout, LoadingLayout, OnlineLayout, PublicToCoreviewLayout, EditCoreviewLayout, AssignCoreviewerLayout };