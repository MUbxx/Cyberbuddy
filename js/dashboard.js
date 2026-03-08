import { auth, db } from "./firebase.js";

import {
collection,
getDocs,
doc,
getDoc
}
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
onAuthStateChanged,
signOut
}
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


const coursesGrid = document.getElementById("coursesGrid");
const logoutBtn = document.getElementById("logoutBtn");


/* AUTH CHECK */

onAuthStateChanged(auth, async (user)=>{

if(!user){

window.location="login.html";
return;

}

const userRef = doc(db,"users",user.uid);
const userSnap = await getDoc(userRef);

const userData = userSnap.data();

loadCourses(userData);

});



/* LOAD COURSES */

async function loadCourses(userData){

coursesGrid.innerHTML = "";

const coursesSnap = await getDocs(collection(db,"courses"));

coursesSnap.forEach(course=>{

const data = course.data();
const courseId = course.id;

const hasAccess =
userData.purchasedCourses?.includes(courseId);


coursesGrid.innerHTML += `

<div class="bg-slate-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition">

<img src="${data.image}"
class="w-full h-48 object-cover">

<div class="p-5">

<h3 class="text-lg font-bold mb-2">
${data.title}
</h3>

<p class="text-slate-400 text-sm mb-4">
${data.description}
</p>

${
hasAccess
?
`<a href="course.html?id=${courseId}"
class="bg-cyan-400 hover:bg-cyan-300 text-black px-4 py-2 rounded-lg text-sm">

Start Learning

</a>`
:
`<button class="bg-slate-600 px-4 py-2 rounded-lg text-sm cursor-not-allowed">

Locked

</button>`
}

</div>

</div>

`;

});

}



/* LOGOUT */

logoutBtn.addEventListener("click", async ()=>{

await signOut(auth);

window.location="login.html";

});
