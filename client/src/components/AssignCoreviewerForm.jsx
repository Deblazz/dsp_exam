import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Select from 'react-select';
import _ from 'lodash';

const AssignCoreviewerForm = (props) => {

  const [coreviewerId, setCoreviewerId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const nextpage = location.state?.nextpage || '/public/to_review';

  const userOptions = _.map(
    props.users.filter(user => user.userId != props.review.reviewerId),
    (user) => ({ value: user.userId, label: user.userName })
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    if (coreviewerId != null) {
      props.appointCoreviewer(coreviewerId)
        .then(() => navigate('/public/to_review'))
        .catch(() => { });
    }
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
        <Form.Label>Select the coreviewer</Form.Label>
        <Select options={userOptions} onChange={option => setCoreviewerId(option.value)} />
      </Form.Group>

      <Button className="mb-3" variant="primary" type="submit" disabled={coreviewerId == null}>Assign Coreviewer</Button>
      &nbsp;
      <Link to={nextpage}>
        <Button className="mb-3" variant="danger">Cancel</Button>
      </Link>
    </Form>
  )
}

export default AssignCoreviewerForm;
