import React from 'react';
import Slider from 'react-slick';

class SliderComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id: this.props.id,
      images: this.props.images,
      activeSlide: 0,
      activeSlide2: 0,
      random: this.props.random
    };
    this.getSimilarCarsByMake = this.getSimilarCarsByMake.bind(this);
  }

  componentDidMount() {
    // console.log(this.props.make);
    this.getSimilarCarsByMake(this.props.make, 7);
  }

  //get similar cars for second  carousel
  getSimilarCarsByMake(type, limit) {
    return fetch(`http://localhost:3004/api/cars/similar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ make: type, limit: limit })
    })
      .then(res => (res.ok ? res : new Error('ERROR fetching similar cars by make')))
      .then(res => {
        // console.log('/api/cars/similar POST REQ', JSON.stringify({ make: type, limit: limit }));
        var body = res.json();
        // console.log('/api/cars/similar POST RES', body);
        return body;
      })
      .then(res => this.setState({ similar: res }));
  }

  render() {
    // console.log('SIMILAR', this.state.similar);
    const settings = {
      dots: false,
      infinite: true,
      speed: 500,
      slidesToShow: 1,
      initialSlide: 0,
      adaptiveHeight: false,
      slidesToScroll: 1
      // beforeChange: (current, next) => this.setState({ activeSlide: next }),
      // afterChange: current => this.setState({ activeSlide2: current })
    };
    const similarSliderSettings = {
      infinite: true,
      adaptiveHeight: true,
      speed: 500,
      slidesToScroll: 3,
      slidesToShow: 3,
      swipeToSlide: true,
      focusOnSelect: true
    };
    return (
      <div>
        <div id="mainSliderContainer">
          <Slider {...settings}>
            {this.state.images
              ? this.state.images.map(
                  (image, i) =>
                    image[1] && (
                      <div key={i}>
                        {' '}
                        <img src={image[1]} />{' '}
                      </div>
                    )
                )
              : null}
          </Slider>
        </div>
        <div className="similarTitle">
          <h1>You may also like...</h1>
        </div>
        <div className="slider slider-nav" id="similar">
          <Slider {...similarSliderSettings}>
            {this.state.similar &&
              this.state.similar.map((similarCar, i) => (
                <div className="similarSlide" key={i}>
                  <a
                    href={`${window.location.pathname.split('/')[0]}/${
                      similarCar.thumb.split('/')[4]
                    }/`}
                  >
                    <img src={similarCar.thumb} />
                    <span className="carDescription">
                      <div>
                        <h2>
                          {similarCar.make.charAt(0).toUpperCase() + similarCar.make.substr(1)}
                        </h2>
                      </div>
                    </span>
                  </a>
                </div>
              ))}
            {this.state.random &&
              this.state.random.map((randomCar, i) => (
                <div className="similarSlide" key={i}>
                  <a
                    href={`${window.location.pathname.split('/')[0]}/${
                      randomCar[1].split('/')[4]
                    }/`}
                  >
                    <img src={randomCar[1]} />
                    <span className="carDescription">
                      <div>
                        <h2>{randomCar[0].charAt(0).toUpperCase() + randomCar[0].substr(1)}</h2>
                      </div>
                    </span>
                  </a>
                </div>
              ))}
          </Slider>
        </div>
      </div>
    );
  }
}

export default SliderComponent;
