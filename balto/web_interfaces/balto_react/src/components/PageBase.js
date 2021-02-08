// Copyright 2018-2021 by Boris Feld

import Divider from "material-ui/Divider";
import Paper from "material-ui/Paper";
import React, { PropTypes } from "react";

import globalStyles from "../styles";

const PageBase = props => {
  const { title, navigation } = props;

  return (
    <div>
      <span style={globalStyles.navigation}>{navigation}</span>

      <Paper style={globalStyles.paper}>
        <h3 style={globalStyles.title}>{title}</h3>

        <Divider />
        {props.children}

        <div style={globalStyles.clear} />
      </Paper>
    </div>
  );
};

PageBase.propTypes = {
  title: PropTypes.string,
  navigation: PropTypes.string,
  children: PropTypes.element
};

export default PageBase;
