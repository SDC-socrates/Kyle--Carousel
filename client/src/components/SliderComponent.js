import React from 'react';
import Slider from 'react-slick';

class SliderComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id: this.props.id,
      images: this.props.images,
      activeSlide: 0,
      activeSlide2: 0
    };
    this.filterSimilarResults = this.filterSimilarResults.bind(this);
  }
  componentDidUpdate() {
    if (this.props.id !== this.state.id && this.state.images[0].Key !== this.props.images[0].Key) {
      fetch(`/similar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ make: this.props.make })
      })
        .then(res => res.json())
        .then(res =>
          this.setState({
            id: this.props.id,
            images: this.props.images,
            similar: this.filterSimilarResults(res, this.props.id)
          })
        );
      console.log(this.state.similar);
    }
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
  //get similar cars for second  carousel
  filterSimilarResults(similar, currentId) {
    let usedIds = [];
    let resultLimit = 7;
    let filteredResults = [];
    //get an id for every matched collection
    similar.forEach(result => {
      if (usedIds.indexOf(result.id) === -1) {
        usedIds.push(result.id);
        filteredResults.push(result);
      }
    });
    //select an image from a random matched collection and limit the results
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
        <div>
          <Slider {...settings}>
            {this.state.images !== undefined
              ? this.state.images.map((image, i) => (
                  <div key={i}>
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
        <div className="similarTitle">
          <h1>You may also like...</h1>
        </div>
        <div className="slider slider-nav" id="similar">
          <Slider {...similarSliderSettings}>
            {this.state.similar &&
              this.state.similar.map((similarCar, i) => (
                <div className="similarSlide" key={i}>
                  <span className="carDescription">
                    <div>
                      <h2>{similarCar.make.charAt(0).toUpperCase() + similarCar.make.substr(1)}</h2>
                    </div>
                  </span>
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
