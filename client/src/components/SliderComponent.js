import React from 'react';
import Slider from 'react-slick';
import apiRootUrl from '../config';

class SliderComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id: this.props.id,
      images: this.props.images,
      activeSlide: 0,
      activeSlide2: 0,
      random: this.props.images
    };
    this.getSuggestedCars = this.getSuggestedCars.bind(this);
  }

  componentDidMount() {
    const search = {
      city: this.props.city,
      long: this.props.long,
      lat: this.props.lat,
      year: this.props.year,
      category: this.props.category
    }
    this.getSuggestedCars(search);
  }

  //get similar cars for second carousel
  getSuggestedCars({city, long, lat, year, category}) {
    return fetch(`${apiRootUrl}/api/cars?city=${city}&long=${long}&lat=${lat}&year=${year}&category=${category}`)
      .then(res => (res.ok ? res : new Error('ERROR fetching similar cars by make')))
      .then(res => {
        var body = res.json();
        console.log(body);
        return body;
      })
      .then(res => {
        console.log(res);
        this.setState({ similar: res });
      });
  }

  render() {
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
                      similarCar.id
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
          </Slider>
        </div>
      </div>
    );
  }
}

export default SliderComponent;
