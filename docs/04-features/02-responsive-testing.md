---
title: Responsive testing
description: Pixeleye supports taking screenshots across multiple screen sizes. Ensure a consistent user experience from mobiles to laptops
---

# Responsive testing

Pixeleye will take pictures of your user interfaces at different screen sizes, allowing you to gain coverage across mobile, tablets, desktops and everything else in-between.

Whilst being an advanced feature, Pixeleye makes it incredibly easy to implement. If your using one of our official sdk's, simply list the sizes you wish to test and Pixeleye will do the rest.

## How it works

Our official sdk's take a dom snapshot of your user interface which is then rendered by our processing server at the specified screen sizes. This allows us to test your user interface at any screen size, regardless of the device you are using to run your tests.

Pixeleye on stores the pictures of your user interface, not the dom snapshot. This means that we also support testing different screen sizes without dom snapshots. Checkout our integration guides for more information on how to implement this for your pipeline.

## Each snapshot is independent

You're user interface is designed to be responsive and varies depending on the screen size. Pixeleye will treat each snapshot as an independent test, allowing you to individually review each snapshot and ensure your user interface is consistent across all screen sizes. If you're using our cloud service, each snapshot will count towards your monthly usage.
