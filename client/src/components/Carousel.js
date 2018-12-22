import React from "react";
import ReactDom from "react-dom";

class Carousel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id: 1,
      img: 1,
      isLoaded: null
    };
  }

  componentDidMount() {}
  render() {
    return (
      <div>
        <img
          src={`https://s3-us-west-2.amazonaws.com/fec-hrr35/TuRashy/${
            this.state.id
          }/${this.state.img}.JPG`}
        />
      </div>
    );
  }
}

export default Carousel;
