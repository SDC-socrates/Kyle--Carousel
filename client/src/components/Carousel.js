import React from 'react';
import ReactDom from 'react-dom';
import SliderComponent from './SliderComponent';

class Carousel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id: this.props.id
    };
    this.handleSimilarCarSelect = this.handleSimilarCarSelect.bind(this);
  }

  componentDidMount() {
    fetch(`/${this.state.id}`)
      .then(res => res.json())
      .then(res => this.setState({ images: res, make: res[0].make }));
  }
  handleSimilarCarSelect(id) {
    console.log('WORKING', id);
    this.setState({
      id: id
    });
    this.forceUpdate();
  }
  render() {
    console.log(this.state.id, 'CURRENT ID');
    return (
      <div>
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
