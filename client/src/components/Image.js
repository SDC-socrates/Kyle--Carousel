import React from "react";

const Image = ({ img }) => (
  <div>
    {
      <img
        src={`https://s3-us-west-2.amazonaws.com/fec-hrr35/${img.id}/${
          img.Key
        }`}
      />
    }
  </div>
);
export default Image;
