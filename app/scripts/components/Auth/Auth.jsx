import React from 'react';
import {browserHistory} from 'react-router';
import UserActions from '../../actions/UserActions';
import UserStore from '../../stores/UserStore';
import FlatButton from 'material-ui/lib/flat-button';
import Tabs from 'material-ui/lib/tabs/tabs';
import Tab from 'material-ui/lib/tabs/tab';
import injectTapEventPlugin from 'react-tap-event-plugin';
import SignUpForm from './SignUp.jsx';
import SignInForm from './SignIn.jsx';

// Needed for onTouchTap
injectTapEventPlugin();

let token = window.localStorage.getItem('token');

const style = {
  tab: {
    backgroundColor: '#0288D1'
  },
  auth: {
    width: '100%',
    textAlign: 'center'
  }
};


class Auth extends React.Component {
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
    if (data && data.error) {
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
      <div className='container' style={style.auth}>
        <Tabs
          tabItemContainerStyle={style.tab}
          >
          <Tab label="Sign In">
            <SignInForm closeModal={this.props.closeModal}/>
          </Tab>
          <Tab label="Sign Up" >
            <SignUpForm closeModal={this.props.closeModal}/>
          </Tab>
        </Tabs>
      </div>
    )
  }
}

export default Auth;
