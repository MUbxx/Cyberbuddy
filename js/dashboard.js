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



/* DOM */

const coursesGrid = document.getElementById("coursesGrid");
const myCoursesGrid = document.getElementById("myCoursesGrid");

const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");

const statCourses = document.getElementById("statCourses");

const searchInput = document.getElementById("searchCourse");



let allCourses = [];
let purchasedCourses = [];



/* AUTH CHECK */

onAuthStateChanged(auth, async(user)=>{

if(!user){

window.location = "login.html";
return;

}

const userSnap = await getDoc(doc(db,"users",user.uid));

if(!userSnap.exists()) return;

const data = userSnap.data();

userName.innerText = data.name || "User";
userEmail.innerText = data.email || "";

purchasedCourses = data.purchasedCourses || [];

statCourses.innerText = purchasedCourses.length;

loadCourses();

});



/* LOAD COURSES FROM FIRESTORE */

async function loadCourses(){

coursesGrid.innerHTML="";
myCoursesGrid.innerHTML="";

const snapshot = await getDocs(collection(db,"courses"));

allCourses=[];

snapshot.forEach(docSnap=>{

const course = docSnap.data();

const id = docSnap.id;

allCourses.push({id,...course});

renderCourse(id,course);

});

}



/* RENDER COURSE CARD */

function renderCourse(id,course){

const card = document.createElement("div");

card.className = "group bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden transition hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10";

card.innerHTML = `

<img
src="${course.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475'}"
class="w-full h-40 object-cover group-hover:scale-105 transition duration-300"
/>

<div class="p-5 space-y-3">

<div class="flex justify-between items-start">

<h4 class="text-lg font-semibold text-white leading-tight">
${course.title}
</h4>

<span class="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
Course
</span>

</div>

<p class="text-sm text-slate-400 line-clamp-2">
${course.description || "Cyber security training"}
</p>

<div class="space-y-1">

<div class="flex justify-between text-[10px] text-slate-500">
<span>Progress</span>
<span>0%</span>
</div>

<div class="w-full bg-slate-800 rounded-full h-1.5">
<div class="bg-blue-500 h-1.5 rounded-full" style="width:0%"></div>
</div>

</div>

<div class="flex items-center justify-between pt-3 border-t border-slate-800">

<div class="flex items-center gap-2 text-xs text-slate-500">
<i class="fas fa-play-circle"></i>
<span>Lessons</span>
</div>

<button onclick="openCourse('${id}')"
class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-semibold transition">

Start Learning

</button>

</div>

</div>
`;

coursesGrid.appendChild(card);



/* IF USER OWNS COURSE */

if(purchasedCourses.includes(id)){

const myCard = card.cloneNode(true);

myCoursesGrid.appendChild(myCard);

}

}



/* SEARCH COURSES */

searchInput.addEventListener("input",function(){

const value = this.value.toLowerCase();

document.querySelectorAll("#coursesGrid > div").forEach(card=>{

card.style.display =
card.innerText.toLowerCase().includes(value)
? ""
: "none";

});

});



/* OPEN COURSE PLAYER */

window.openCourse = (courseId)=>{

window.location = `course.html?id=${courseId}`;

};



/* LOGOUT */

document.getElementById("logoutBtn").onclick = async()=>{

await signOut(auth);

window.location = "login.html";

};



/* CERTIFICATE DOWNLOAD */

window.downloadCertificate = async(courseId)=>{

const res = await fetch("/data/certificates.json");

const certs = await res.json();

const cert = certs.find(c=>c.courseId===courseId);

if(!cert){

alert("Certificate not available");
return;

}

window.open(cert.url);

};



/* INVOICE DOWNLOAD */

window.downloadInvoice = async(courseId)=>{

const res = await fetch("/data/invoices.json");

const invoices = await res.json();

const invoice = invoices.find(i=>i.courseId===courseId);

if(!invoice){

alert("Invoice not found");
return;

}

window.open(invoice.url);

};
