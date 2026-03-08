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


const grid=document.getElementById("coursesGrid");


onAuthStateChanged(auth,async(user)=>{

if(!user){

location="login.html";
return;

}

const userSnap=await getDoc(doc(db,"users",user.uid));
const userData=userSnap.data();

loadCourses(userData);

});


async function loadCourses(userData){

const courses=await getDocs(collection(db,"courses"));

grid.innerHTML="";

courses.forEach(course=>{

const data=course.data();

const access=userData.purchasedCourses?.includes(course.id);

grid.innerHTML+=`

<div class="bg-gray-800 p-4 rounded-lg">

<img src="${data.image}" class="rounded mb-3">

<h3 class="font-bold">${data.title}</h3>

<p class="text-gray-400 text-sm mb-3">${data.description}</p>

${
access
?
`<a href="course-player.html?id=${course.id}" class="bg-cyan-400 text-black px-4 py-2 rounded">Start Learning</a>`
:
`<button class="bg-gray-600 px-4 py-2 rounded">Locked</button>`
}

</div>

`;

});

}


document.getElementById("logoutBtn").onclick=()=>{

signOut(auth);

location="login.html";

};
