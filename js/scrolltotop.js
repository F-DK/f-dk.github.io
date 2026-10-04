// When the user scrolls down 100px from the top of the document, show the button
window.onscroll = function() {
	scrollFunction()
};

function scrollFunction() {
  if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
  	document.getElementById("toplink").style.opacity = "1";
  } else {
    document.getElementById("toplink").style.opacity = "0";
  }
}

document.getElementById("toplink").style.opacity = "0";
