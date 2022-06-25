// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function() {
	scrollFunction()
};

function scrollFunction() {
  if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
  //   document.getElementById("toplink").style.display = "block";
  // } else {
  //     document.getElementById("toplink").style.display = "none";
  // }
  	document.getElementById("toplink").style.opacity = "1";
  } else {
    document.getElementById("toplink").style.opacity = "0";
  }
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
  document.body.scrollTop = 0; // For Chrome, Safari and Opera 
  document.documentElement.scrollTop = 0; // For IE and Firefox
}

// document.getElementById("toplink").style.display = "none";
document.getElementById("toplink").style.opacity = "0";