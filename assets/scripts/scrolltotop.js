// JavaScript: Show/hide the button and handle the scroll
var myButton = document.getElementById("scrollbtn");

// When the user scrolls down 20px from the top, show the button
window.onscroll = function() {
  if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
    myButton.style.display = "block";
  } else {
    myButton.style.display = "none";
  }
};

// When the user clicks on the button, scroll to the top smoothly
function topFunction() {
  window.scroll({
    top: 0,
    left: 0,
    behavior: 'smooth' // Native smooth scrolling
  });
}
