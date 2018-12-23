import React from "react";
import ReactDom from "react-dom";
import Slider from "./Slider";

class Carousel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id: 20,
      images: [{ key: "1.jpg" }],
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
    console.log(document.location.href, "LOCATION");
    // console.log(this.state.isLoaded, "LOADED");
    // console.log(this.state.images, "IMAGES");
    return (
      <div>
        <Slider images={this.state.images} />
        {/* <img
          src={`https://s3-us-west-2.amazonaws.com/fec-hrr35/${this.state.id}/${
            this.state.images[0]
          }`}
        /> */}
      </div>
    );
  }
}

export default Carousel;
