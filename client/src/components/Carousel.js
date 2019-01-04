import React from 'react';
import NavBar from './NavBar';
import SliderComponent from './SliderComponent';

class Carousel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id: this.props.id
    };
    this.handleSimilarCarSelect = this.handleSimilarCarSelect.bind(this);
  }
  componentDidUpdate(prevState) {
    if (this.state.id !== prevState.id) {
      fetch(`/${this.state.id}`)
        .then(res => res.json())
        .then(res => this.setState({ id: this.state.id, images: res, make: res[0].make }));
    }
  }
  componentDidMount() {
    fetch(`/${this.state.id}`)
      .then(res => res.json())
      .then(res => this.setState({ images: res, make: res[0].make }));
  }
  handleSimilarCarSelect(id) {
    this.setState({
      id: id
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
            similar={this.handleSimilarCarSelect}
          />
        )}
      </div>
    );
  }
}

export default Carousel;
