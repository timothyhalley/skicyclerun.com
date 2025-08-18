import { SkiCycleRunConfig } from "skicyclerun.config";

const getPageNumbers = (numberOfPosts: number) => {
  const numberOfPages = numberOfPosts / Number(SkiCycleRunConfig.postPerPage);

  let pageNumbers: number[] = [];
  for (let i = 1; i <= Math.ceil(numberOfPages); i++) {
    pageNumbers = [...pageNumbers, i];
  }

  return pageNumbers;
};

export default getPageNumbers;
