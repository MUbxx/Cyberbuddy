```javascript
import { db } from "./firebase.js";

import {
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";


const modulesContainer = document.getElementById("modulesContainer");
const videoPlayer = document.getElementById("videoPlayer");
const lessonTitle = document.getElementById("lessonTitle");


/* CHANGE THIS COURSE NAME */

const courseName = "Web Pentesting";



async function loadModules(){

const modules = await getDocs(
collection(db,"courses",courseName,"modules")
);

modulesContainer.innerHTML="";


for(const module of modules.docs){

const modData = module.data();

const moduleDiv = document.createElement("div");
moduleDiv.className="module p-4";

moduleDiv.innerHTML=`
<h3 class="font-bold text-sm mb-2">${modData.title}</h3>
<div id="lessons-${module.id}" class="space-y-1"></div>
`;

modulesContainer.appendChild(moduleDiv);


/* LOAD LESSONS */

const lessons = await getDocs(
collection(db,"courses",courseName,"modules",module.id,"lessons")
);

const lessonsContainer=document.getElementById(`lessons-${module.id}`);

lessons.forEach(lesson=>{

const data=lesson.data();

const lessonDiv=document.createElement("div");

lessonDiv.className="lesson text-sm";

lessonDiv.innerText=data.title;

lessonDiv.onclick=()=>{

document.querySelectorAll(".lesson").forEach(l=>{
l.classList.remove("active");
});

lessonDiv.classList.add("active");

videoPlayer.src=data.video;

lessonTitle.innerText=data.title;

};

lessonsContainer.appendChild(lessonDiv);

});

}

}


loadModules();
```
