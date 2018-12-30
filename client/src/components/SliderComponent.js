import React from 'react';
import Image from './Image';
import Slider from 'react-slick';

class SliderComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id: this.props.id,
      images: this.props.images
    };
  }
  render() {
    const settings = {
      dots: true,
      infinite: true,
      speed: 500,
      slidesToShow: 1,
      initialSlide: 0,
      adaptiveHeight: false,
      slidesToScroll: 1
    };
    return (
      <div id="slider">
        <Slider {...settings}>
          {console.log(this.state)}
          {this.state.images !== undefined
            ? this.state.images.map((image, i) => (
                <div key={i} className="slideContainer">
                  <img
                    src={`https://s3-us-west-2.amazonaws.com/fec-hrr35/${this.state.id}/${
                      image.Key
                    }`}
                  />
                </div>
              ))
            : null}
        </Slider>
      </div>
    );
  }
}

export default SliderComponent;
