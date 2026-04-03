
export const getRandomStyle = () => {
  const styles = [
    { brightness: 0.05, contrast: 1.1 },
    { brightness: -0.05, contrast: 1.2 },
    { brightness: 0.1, contrast: 0.9 },
  ];
  return styles[Math.floor(Math.random() * styles.length)];
};
