import React from 'react';
import { Table, Button } from 'react-bootstrap/'
import { Link, useLocation } from 'react-router-dom';
import Pagination from "react-js-pagination";

function FilmToCoreviewTable(props) {
  const handlePageChange = pageNumber => {
    props.refreshFilms(pageNumber);
  }

  return (
    <>
      <Table>
        <tbody>
          {
            props.films.map((film) =>
              <CoreviewFilmRow filmData={film} key={`${film.id}-${film.reviewerId}`} />
            )
          }
        </tbody>
      </Table>
      <Pagination
        itemClass="page-item"
        linkClass="page-link"
        activePage={parseInt(sessionStorage.getItem("currentPage"))}
        itemsCountPerPage={parseInt(sessionStorage.getItem("totalItems")) / parseInt(sessionStorage.getItem("totalPages"))}
        totalItemsCount={parseInt(sessionStorage.getItem("totalItems"))}
        pageRangeDisplayed={10}
        onChange={handlePageChange}
        pageSize={parseInt(sessionStorage.getItem("totalPages"))}
      />
    </>
  );
}

function CoreviewFilmRow(props) {
  const location = useLocation();

  return (
    <tr>
      <td>
        <p className="keep-white-space">{`${props.filmData.title}`}</p>
      </td>
      <td>
        <Link to={"/public/" + props.filmData.id + "/reviews/" + props.filmData.reviewerId + "/coreview"}
          state={[{ film: props.filmData }, { nextpage: location.pathname }]}>
          <Button variant="primary">Edit Draft</Button>{' '}
        </Link>
      </td>
    </tr>
  );
}

export default FilmToCoreviewTable;
