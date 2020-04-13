import React from 'react';
import { render } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import {App} from "../App";
// import { findByTestId} from "@testing-library/dom";


test('renders show/hide privacy link', () => {

  const { getByText } = render(<App/>);
  const  showButtonElement = getByText(/show privacy policy/i);
  expect(showButtonElement).toBeInTheDocument();

  fireEvent.click(showButtonElement);
  const  hideButtonElement = getByText(/hide privacy policy/i);

  expect(hideButtonElement).toBeInTheDocument();

  const  textHeaderElement = getByText(/Palindrome Forge Application Privacy Statement/i);
  expect(textHeaderElement).toBeInTheDocument();

});

//

test('renders Google sign in button', () => {
  const { getByText } = render(<App/>);
  const  buttonElement = getByText(/Sign in with Google/i);
  expect(buttonElement).toBeInTheDocument();
});

test('renders Facebook sign in button', () => {
  const { getByText } = render(<App/>);
  const  buttonElement = getByText(/Sign in with Facebook/i);
  expect(buttonElement).toBeInTheDocument();
});

