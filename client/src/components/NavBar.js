import React from 'react';

class NavBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  render() {
    return (
      <div id="navContainer">
        <div className="categoryContainer">
          <div className="category">Test</div>
          <div className="category">About</div>
          <div className="category">Make</div>
        </div>
        <div className="logo">TuRash</div>
      </div>
    );
  }
}

export default NavBar;
