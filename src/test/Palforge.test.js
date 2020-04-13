import React from 'react';
import { render } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import Palforge from "../Palforge";
import { screen } from '@testing-library/dom'

  // import { findByTestId} from "@testing-library/dom";

const A_PALINDROME = "A man á plan a canal: Panama!";
const A_PALINDROME_SMOOTHED = "A M A N A P L A N A C A N A L P A N A M A";
const A_PALINDROME_TURNAROUND = "(Turnaround is A C A )";
const NOT_A_PALINDROME = "A man á plan a canal is not Panama?";
const NOT_A_PALINDROME_SMOOTHED = "A M A N A P T O N S I L A N A C A N A L P A N A M A";
const NOT_A_PALINDROME_TURNAROUND = "(Turnaround is L A N A )";


function fillWithPalindromeAndCheck() {
  const {getByPlaceholderText} = render(<Palforge/>);

  const inputArea = getByPlaceholderText(/Enter text/i);
  fireEvent.change(inputArea, {target: {value: A_PALINDROME}});
  expect(inputArea).toHaveValue(A_PALINDROME);
  // expect 1 diacritical and 2 punctuation
  expect(inputArea).toHaveTextContent(/^[\sa-z0-9á\!\:]+$/i);

  const turnaround = getByPlaceholderText(/Turnaround/i);
  expect(turnaround).toBeInTheDocument();
  expect(turnaround).toHaveTextContent(A_PALINDROME_TURNAROUND );

  const inputAsTyped = getByPlaceholderText(/Input As Typed/i);
  expect(inputAsTyped).toBeInTheDocument();
  expect(inputAsTyped).toHaveTextContent(A_PALINDROME );

  const reversedInput = getByPlaceholderText(/Reversed Input/i);
  expect(reversedInput).toBeInTheDocument();
  // no puncutation or diacriticals
  expect(reversedInput).toHaveTextContent(/^[\sa-z0-9]+$/i);
  // reversed is itself
  expect(reversedInput).toHaveTextContent(A_PALINDROME_SMOOTHED);

}

function fillWithNonPalindromeAndCheck() {
  const {getByPlaceholderText} = render(<Palforge/>);

  const inputArea = getByPlaceholderText(/Enter text/i);
  fireEvent.change(inputArea, {target: {value: NOT_A_PALINDROME}});
  expect(inputArea).toHaveValue(NOT_A_PALINDROME);
  // expect 1 diacritical and 1 punctuation
  expect(inputArea).toHaveTextContent(/^[\sa-z0-9á\?]+$/i);

  const turnaround = getByPlaceholderText(/Turnaround/i);
  expect(turnaround).toBeInTheDocument();
  expect(turnaround).toHaveTextContent(NOT_A_PALINDROME_TURNAROUND );

  const inputAsTyped = getByPlaceholderText(/Input As Typed/i);
  expect(inputAsTyped).toBeInTheDocument();
  expect(inputAsTyped).toHaveTextContent(NOT_A_PALINDROME );

  const reversedInput = getByPlaceholderText(/Reversed Input/i);
  expect(reversedInput).toBeInTheDocument();
  // no puncutation or diacriticals
  expect(reversedInput).toHaveTextContent(/^[\sa-z0-9]+$/i);
// match reversed
  expect(reversedInput).toHaveTextContent(NOT_A_PALINDROME_SMOOTHED.split().reverse().join(" "));

}

test('Input Palindrome', () => {
  fillWithPalindromeAndCheck();

});

test('Input non palindrome', () => {
  fillWithNonPalindromeAndCheck();

});

// test('renders turnaround', () => {
//   const {getByPlaceholderText} = render(<Palforge/>);
//   const inputArea = getByPlaceholderText(/Enter text/i);
//   fillWithPalindromeAndCheck(inputArea);
//
// });
