import {react,useState, useEffect} from 'react'

function BackButton() {
  return (
    <div className="back-outer" style={{maxHeight:'20px'}}>
        <a href="https://kd-000.github.io" style={{textDecoration:'none', color:'#555', fontWeight:'500'}}>← Katie Day</a>
    </div>
  );
}

export default BackButton;