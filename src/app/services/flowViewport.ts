export function getCanvasCenterScreenPoint() {
  const flowRoot = document.querySelector('.react-flow');
  const rect = flowRoot?.getBoundingClientRect();

  if (rect) {
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  return {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };
}
