import React, {useContext, useState} from 'react';
import { Form, Button } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import MessageContext from '../messageCtx';

const CoreviewForm = (props) => {

  const [text, setText] = useState(props.currentDraft.text);

  const navigate = useNavigate();
  const location = useLocation();
  const {handleErrors} = useContext(MessageContext);

  const nextpage = location.state?.nextpage || '/public/to_coreview';

  const handleSubmit = (event) => {
  event.preventDefault();
  props.submitNewDraft(text)
    //Navigate to the next page after successful draft submission
    .then(() => navigate('/public/to_coreview'))
    .catch(() => {});
}


  return (
    <Form className="block-example border border-primary rounded mb-0 form-padding" onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Film ID</Form.Label>
        <Form.Control type="text" value={props.review.filmId} disabled />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Reviewer ID</Form.Label>
        <Form.Control type="text" value={props.review.reviewerId} disabled />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Check type="checkbox" label="Completed" checked={props.review.completed} disabled />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Review Date</Form.Label>
        <Form.Control type="date" value={props.review.reviewDate ? props.review.reviewDate.format('YYYY-MM-DD') : ''} disabled />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Rating</Form.Label>
        <Form.Control type="text" value={props.review.rating} disabled />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Review Text</Form.Label>
        <Form.Control as="textarea" rows={3} value={text} onChange={event => setText(event.target.value)}/>
      </Form.Group>

      <Button className="mb-3" variant="primary" type="submit">Save Draft</Button>
      &nbsp;
      <Link to={nextpage}>
        <Button className="mb-3" variant="danger">Cancel</Button>
      </Link>
    </Form>
  )
}

export default CoreviewForm;
