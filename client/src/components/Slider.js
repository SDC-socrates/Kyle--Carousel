import React from "react";
import Image from "./Image";

const Slider = ({ images }) => (
  <div>
    SLIDER TEST
    {images.map((el, i) => (
      // console.log(el)
      <Image img={el} key={i} />
    ))}
  </div>
);

export default Slider;
