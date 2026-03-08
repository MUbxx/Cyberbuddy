import { auth, db } from "./firebase.js";

import {
collection,
getDocs,
doc,
onSnapshot
}
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
onAuthStateChanged,
signOut
}
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


const coursesGrid = document.getElementById("coursesGrid");
const myCoursesGrid = document.getElementById("myCoursesGrid");

let userData = null;


/* AUTH CHECK */

onAuthStateChanged(auth, async (user) => {

if(!user){
window.location="login.html";
return;
}

/* realtime user listener */

const userRef = doc(db,"users",user.uid);

onSnapshot(userRef,(snap)=>{

userData = snap.data();

/* reload courses whenever admin grants */

loadCourses();

});

});


/* LOAD COURSES */

async function loadCourses(){

if(!userData) return;

coursesGrid.innerHTML = "";
myCoursesGrid.innerHTML = "";

const coursesSnap = await getDocs(collection(db,"courses"));

coursesSnap.forEach(course => {

const data = course.data();
const courseId = course.id;

/* correct unlock logic */

const hasAccess =
userData.purchasedCourses &&
userData.purchasedCourses.includes(courseId);


/* course card */

const card = `

<div class="glass rounded-xl overflow-hidden border border-slate-800 hover:border-cyan-400 transition">

<img src="${data.image || 'https://via.placeholder.com/400x200'}"
class="w-full h-40 object-cover">

<div class="p-5">

<h3 class="font-bold text-lg mb-2">
${data.title}
</h3>

<p class="text-sm text-slate-400 mb-4">
${data.description || ""}
</p>

${
hasAccess
?
`<a href="course.html?id=${courseId}"
class="bg-cyan-400 text-black px-4 py-2 rounded-lg text-sm font-bold">

Start Learning

</a>`
:
`<button class="bg-slate-700 px-4 py-2 rounded-lg text-sm text-slate-400">

Locked

</button>`
}

</div>

</div>

`;

coursesGrid.innerHTML += card;

/* populate My Courses tab */

if(hasAccess){

myCoursesGrid.innerHTML += card;

}

});

}


/* LOGOUT */

document.getElementById("logoutBtn").onclick = async ()=>{

await signOut(auth);

window.location="login.html";

};
