import React from 'react';
import {browserHistory} from 'react-router';
import UserActions from '../../actions/UserActions';
import UserStore from '../../stores/UserStore';
import UserDocs from './MyDocsList.jsx';
import UserInfo from './UserInfo.jsx';
import AllDocs from './AllDocsList.jsx';
import Card from 'material-ui/lib/card/card';
import CardActions from 'material-ui/lib/card/card-actions';
import CardHeader from 'material-ui/lib/card/card-header';
import CardMedia from 'material-ui/lib/card/card-media';
import CardTitle from 'material-ui/lib/card/card-title';
import CardText from 'material-ui/lib/card/card-text';
import FlatButton from 'material-ui/lib/flat-button';
import Tabs from 'material-ui/lib/tabs/tabs';
import Tab from 'material-ui/lib/tabs/tab';

const styles = {
  headline: {
    fontSize: 24,
    paddingTop: 16,
    marginBottom: 12,
    fontWeight: 400
  },
  tab: {
    backgroundColor: '#0288D1'
  }
};

class Dash extends React.Component {
  constructor(props) {
    super(props);
    this.getSession = this.getSession.bind(this);
  }

  componentDidMount() {
    UserActions.session();
    UserStore.addChangeListener(this.getSession, 'session');
  }

  getSession() {
    let data = UserStore.getSession();
    if (data && !data.loggedIn) {
      browserHistory.push('/');
    } else {
      browserHistory.push('/dashboard');
    }
  }

  componentWillUnmount() {
    UserStore.removeChangeListener(this.getSession, 'session');
  }


  render() {
    return (
      <div className="row dcman">
        <div className="col s4 profile">
          <UserInfo />
        </div>
        <div className="col s8 docsList">
          <Tabs tabItemContainerStyle={styles.tab}>
            <Tab label="My Docs" >
              <UserDocs />
            </Tab>
            <Tab label="All Docs" >
              <AllDocs />
            </Tab>
          </Tabs>
        </div>
      </div>
    );
  }
}

export default Dash;
