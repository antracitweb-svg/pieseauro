// Test the esc function logic
function esc(s) {
  return String(s).replace(/[&<>"']/g, function(c) {
    if (c === "&") return "&";
    if (c === "<") return "<";
    if (c === ">") return ">";
    if (c === "\"") return "\"";
    if (c === "'") return " ";
    return "";
  });
}

// Test cases
console.log(esc("test & more < stuff \"quoted\""));  // should: test & more  stuff  quoted
console.log(esc("a<b>c"));  // should: a<b>c -> a<c (but we keep < and >)
console.log(esc("normal text"));  // should: normal text