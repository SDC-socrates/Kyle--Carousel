import React from 'react';
import renderer from 'react-test-renderer';
import Carousel from './Carousel';
import NavBar from './NavBar';
import SliderComponent from './SliderComponent';

test('Similar carousel should load images of cars with the same make' () => {
  const Slider = renderer.create(
    <SliderComponent make="mustang"/>
  );
  let tree = Slider.toJSON();
  expect(tree).toMatchSnapshot();

})


