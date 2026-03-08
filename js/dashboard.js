import { auth, db } from "./firebase.js";

import {
collection,
getDocs,
doc,
getDoc,
onSnapshot
}
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
onAuthStateChanged,
signOut,
sendPasswordResetEmail
}
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


const coursesGrid=document.getElementById("coursesGrid");
const myCoursesGrid=document.getElementById("myCoursesGrid");

let userData;


/* AUTH */

onAuthStateChanged(auth,async(user)=>{

if(!user){
window.location="login.html";
return;
}

const ref=doc(db,"users",user.uid);

onSnapshot(ref,(snap)=>{

userData=snap.data();

loadCourses();

});

});


/* LOAD COURSES */

async function loadCourses(){

coursesGrid.innerHTML="";
myCoursesGrid.innerHTML="";

const courses=await getDocs(collection(db,"courses"));

courses.forEach(course=>{

const data=course.data();
const id=course.id;

const access=userData.purchasedCourses?.includes(id);

const card=`

<div class="glass rounded-xl overflow-hidden">

<img src="${data.image}"
class="h-40 w-full object-cover">

<div class="p-4">

<h3 class="font-bold">${data.title}</h3>

<p class="text-sm text-slate-400 mb-4">
${data.description||""}
</p>

${
access
?
`<a href="course.html?id=${id}"
class="bg-cyan-500 px-4 py-2 rounded">Start Learning</a>`
:
`<button class="bg-slate-700 px-4 py-2 rounded">Locked</button>`
}

</div>

</div>

`;

coursesGrid.innerHTML+=card;

if(access){
myCoursesGrid.innerHTML+=card;
}

});

}



/* SIDEBAR TOGGLE */

document.getElementById("toggleSidebar").onclick=()=>{
document.getElementById("sidebar").classList.toggle("collapsed");
};



/* TAB SWITCHING */

document.querySelectorAll(".navBtn").forEach(btn=>{

btn.onclick=()=>{

document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));

document.getElementById(btn.dataset.tab).classList.add("active");

};

});



/* LOGOUT */

document.getElementById("logoutBtn").onclick=async()=>{

await signOut(auth);

window.location="login.html";

};



/* PASSWORD RESET */

document.getElementById("resetBtn").onclick=async()=>{

const user=auth.currentUser;

await sendPasswordResetEmail(auth,user.email);

alert("Password reset email sent");

};
