import * as React from "react";
import * as ReactDOM from "react-dom";
import Image from "../Image";

import * as TestUtils from "react-addons-test-utils";

import * as renderer from "react-test-renderer";

test("Image check snapshot", () => {
    const component = renderer.create(
        <Image src="http://www.facebook.com" />,
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("Link changes the class when hovered", () => {
    const component = TestUtils.renderIntoDocument(
        <Image src="http://www.facebook.com" />,
    );

    const componentNode = ReactDOM.findDOMNode(component);
    expect(componentNode.textContent).toEqual("");
});
