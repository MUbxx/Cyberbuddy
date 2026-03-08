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


/* SWITCH SECTIONS */

window.showSection = (section)=>{

document.getElementById("dashboard").classList.add("hidden");
document.getElementById("courses").classList.add("hidden");
document.getElementById("profile").classList.add("hidden");

document.getElementById(section).classList.remove("hidden");

};



/* AUTH CHECK */

onAuthStateChanged(auth, async (user)=>{

if(!user){

window.location="login.html";
return;

}

/* LOAD USER */

const userDoc = await getDoc(doc(db,"users",user.uid));

const userData = userDoc.data();


/* PROFILE */

document.getElementById("name").innerText = userData.name;
document.getElementById("email").innerText = userData.email;


/* ALL COURSES */

const courseSnap = await getDocs(collection(db,"courses"));

const courseList = document.getElementById("courseList");

courseSnap.forEach(c=>{

courseList.innerHTML += `

<div class="bg-gray-800 p-4 mb-3 rounded">

<h3>${c.data().title}</h3>

<button onclick="openCourse('${c.id}')"
class="bg-cyan-400 text-black px-3 py-1 rounded">

Open

</button>

</div>

`;

});


/* MY COURSES */

const myCourses = document.getElementById("myCourses");

const purchased = userData.purchasedCourses || [];

purchased.forEach(id=>{

myCourses.innerHTML += `

<div class="bg-gray-800 p-4 mb-3 rounded">

Course ID: ${id}

<button onclick="openCourse('${id}')"
class="bg-cyan-400 text-black px-3 py-1 rounded">

Open

</button>

</div>

`;

});

});



/* OPEN COURSE */

window.openCourse = (id)=>{

window.location = "course.html?id="+id;

};



/* LOGOUT */

document.getElementById("logoutBtn").onclick = async ()=>{

await signOut(auth);

window.location="login.html";

};
