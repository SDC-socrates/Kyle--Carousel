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
      // console.log('first Res', res);
      this.setState({
        id: Number(this.props.id),
        images: res,
        make: res[0].make,
        random: res[0].random
      });
    });
  }

  getCarById(id) {
    return fetch(`http://localhost:3003/api/turash/images/${id}`)
      .then(res => (res.ok ? res : new Error('ERROR fetching car by id')))
      .then(res => {
        return res.json();
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
            random={this.state.random}
          />
        )}
      </div>
    );
  }
}

export default Carousel;
