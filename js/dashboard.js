import { auth, db } from "./firebase.js";

import {
collection,
getDocs,
doc,
getDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


const coursesGrid = document.getElementById("coursesGrid");
const myCoursesGrid = document.getElementById("myCoursesGrid");

const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");

const searchInput = document.getElementById("searchCourse");


let allCourses = [];
let purchased = [];


/* AUTH CHECK */

onAuthStateChanged(auth, async(user)=>{

if(!user){
window.location="login.html";
return;
}

const userSnap = await getDoc(doc(db,"users",user.uid));

const data = userSnap.data();

userName.innerText = data.name;
userEmail.innerText = data.email;

purchased = data.purchasedCourses || [];

loadCourses();

});


/* LOAD COURSES */

async function loadCourses(){

coursesGrid.innerHTML="";
myCoursesGrid.innerHTML="";

const snap = await getDocs(collection(db,"courses"));

allCourses = [];

snap.forEach(c=>{

const course = c.data();

allCourses.push({
id:c.id,
...course
});

renderCourse(c.id,course);

});

}


/* RENDER COURSE CARD */

function renderCourse(id,course){

const card = document.createElement("div");

card.className = "card bg-gray-800 rounded overflow-hidden";

card.innerHTML = `

<img src="${course.thumbnail || 'https://via.placeholder.com/400x200'}"
class="w-full h-40 object-cover">

<div class="p-4">

<h4 class="font-bold text-lg mb-1">
${course.title}
</h4>

<p class="text-sm text-gray-400 mb-3">
${course.description || "Cyber security course"}
</p>

<button onclick="openCourse('${id}')"
class="bg-cyan-500 px-3 py-1 text-black rounded">

Start Learning

</button>

</div>

`;

coursesGrid.appendChild(card);


/* IF USER OWNS COURSE */

if(purchased.includes(id)){

const myCard = card.cloneNode(true);

myCoursesGrid.appendChild(myCard);

}

}


/* COURSE SEARCH */

searchInput.addEventListener("input",function(){

const value = this.value.toLowerCase();

document.querySelectorAll("#coursesGrid .card").forEach(card=>{

card.style.display =
card.innerText.toLowerCase().includes(value)
? ""
: "none";

});

});


/* OPEN COURSE */

window.openCourse = (id)=>{

window.location = "course.html?id="+id;

};


/* TAB SWITCH */

window.showTab = (tab)=>{

document.querySelectorAll(".tab").forEach(t=>{
t.classList.add("hidden");
});

document.getElementById(tab).classList.remove("hidden");

};


/* LOGOUT */

document.getElementById("logoutBtn").onclick = async()=>{

await signOut(auth);

window.location="login.html";

};
