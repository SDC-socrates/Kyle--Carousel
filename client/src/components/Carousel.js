import React from 'react';
import ReactDom from 'react-dom';
import SliderComponent from './SliderComponent';

class Carousel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id: 3,
      isLoaded: null
    };
  }

  componentDidMount() {
    fetch(`/${this.state.id}`)
      .then(res => res.json())
      .then(res => this.setState((this.state.images = res)))
      .then((this.state.isLoaded = true));
  }
  render() {
    // console.log(document.location.href, 'LOCATION');
    return (
      <div id="sliderContainer">
        {this.state.isLoaded && <SliderComponent images={this.state.images} id={this.state.id} />}
      </div>
    );
  }
}

export default Carousel;
