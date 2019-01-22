import React from 'react';
import NavBar from './NavBar';
import SliderComponent from './SliderComponent';

class Carousel extends React.Component {
  constructor(props) {
    super(props);
    this.state = { id: this.props.id };
    this.getCarById = this.getCarById.bind(this);
  }

  componentDidMount() {
    let targetID = window.location.pathname.slice(1, window.location.pathname.length - 1);
    targetID ? (this.state.id = targetID) : (this.state.id = 15);

    this.getCarById(this.state.id).then(res => {
      this.setState({
        id: Number(this.props.id),
        images: res.images,
        make: res.make,
        random: res.images,
        city: res.city,
        long: res.long,
        lat: res.lat,
        category: res.category,
        year: res.year
      });
    });
  }

  getCarById(id) {
    return fetch(`http://localhost:3004/api/cars/${id}`)
      .then(res => (res.ok ? res : new Error('ERROR fetching car by id')))
      .then(res => {
        var body = res.json();
        return body;
      });
  }

  render() {
    return (
      <div>
        <NavBar />
        {this.state.images && (
          <SliderComponent
            images={this.state.images}
            id={this.state.id}
            make={this.state.make}
            similar={this.state.similar}
            random={this.state.images}
            city={this.state.city}
            long={this.state.long}
            lat={this.state.lat}
            category={this.state.category}
            year={this.state.year}
          />
        )}
      </div>
    );
  }
}

export default Carousel;
