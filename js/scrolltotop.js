// Show the back-to-top link once the page is scrolled past 100px
const toplink = document.getElementById("toplink");
const update = () => toplink.style.opacity = scrollY > 100 ? "1" : "0";
window.onscroll = update;
update();
