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
    this.filterSimilarResults = this.filterSimilarResults.bind(this);
  }

  componentDidMount() {
    fetch(`/similar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ make: this.props.make })
    })
      .then(res => res.json())
      .then(res => res)
      .then(res => this.setState({ similar: this.filterSimilarResults(res, this.state.id) }));
  }

  filterSimilarResults(similar, currentId) {
    let usedIds = [];
    let resultLimit = 7;
    let filteredResults = [];
    similar.forEach(result => {
      if (usedIds.indexOf(result.id) === -1) {
        usedIds.push(result.id);
        filteredResults.push(result);
      }
    });
    let randomSelection = function(limit, results) {
      let duplicateIds = [];
      let counter = limit;
      let random = [];
      while (counter >= 0) {
        let randomIndex = Math.floor(Math.random() * results.length);
        if (
          duplicateIds.indexOf(results[randomIndex].id) === -1 &&
          results[randomIndex].Key !== '' &&
          results[randomIndex].id !== currentId
        ) {
          duplicateIds.push(results[randomIndex].id);
          random.push(results[randomIndex]);
        }
        counter--;
      }

      return random;
    };
    return randomSelection(resultLimit, filteredResults);
  }
  render() {
    const settings = {
      dots: false,
      infinite: true,
      speed: 500,
      slidesToShow: 1,
      initialSlide: 0,
      adaptiveHeight: false,
      slidesToScroll: 1,
      beforeChange: (current, next) => this.setState({ activeSlide: next }),
      afterChange: current => this.setState({ activeSlide2: current })
    };
    const similarSliderSettings = {
      slidesToShow: 3,
      infinite: true,
      adaptiveHeight: false,
      speed: 500,
      slidesToScroll: 1,
      slidesToShow: 3,
      swipeToSlide: true,
      focusOnSelect: true
    };

    return (
      <div>
        <div class="slider slider-single">
          <Slider {...settings}>
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
        <div class="slider slider-nav" id="similar">
          <Slider {...similarSliderSettings}>
            {this.state.similar &&
              this.state.similar.map((similarCar, i) => (
                <div class="similarSlide" key={i}>
                  <a onClick={() => this.props.similar(similarCar.id)}>
                    <img
                      src={`https://s3-us-west-2.amazonaws.com/fec-hrr35/${similarCar.id}/${
                        similarCar.Key
                      }`}
                    />
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
