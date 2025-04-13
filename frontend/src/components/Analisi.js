const analysis = document.createElement("div");
analysis.classList.add("team__type-analysis", "type-analysis_hidden");
const defTallies = document.createElement("ol");
const defHeading = document.createElement("h3");
defHeading.innerHTML = "Team Defense";
defHeading.classList.add("type-analysis__heading");
createTallies(defTallies);
const atkTallies = defTallies.cloneNode(true);
defTallies.classList.add("type-analysis__grid", "type-analysis__grid_defense");
atkTallies.classList.add("type-analysis__grid", "type-analysis__grid_attack");
const atkHeading = document.createElement("h3");
atkHeading.innerHTML = "Coverage";
atkHeading.classList.add("type-analysis__heading");
analysis.append(defHeading, defTallies, atkHeading, atkTallies);
analysis.querySelectorAll(".tally__mark").forEach((mark) => {
  mark.addEventListener("mouseenter", highlightTargetPokemon);
  mark.addEventListener("mouseleave", removeHighlights);
});
const note = document.querySelector(".type-analysis__note");
analysis.append(note);

// Create button to hide/show team analysis
button = document.createElement("button");
button.innerHTML = "Show Team Analysis";
button.classList.add("team__button");
button.addEventListener("click", (event) => {
  const selector = "type-analysis_hidden";
  if (analysis.classList.contains(selector)) {
    event.target.innerHTML = "Hide Team Analysis";
    analysis.classList.remove(selector);
  } else {
    event.target.innerHTML = "Show Team Analysis";
    analysis.classList.add(selector);
  }
});
section.append(analysis);
buttonContainer.append(button);
