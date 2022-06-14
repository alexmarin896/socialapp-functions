const isEmail = (email) => 
{
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if(email.match(regEx)) return true;
  else return false ;
};

const isEmpty = (string) => {
  if(string.trim() === '') return true;
  else return false;
};

exports.validateSignupData = (data) => {
    let errors = {};

    if(isEmpty(data.email))
    {
      errors.email = 'Campul email nu poate fi liber';
    }
    else if (!isEmail(data.email))
    {
      errors.email = 'Trebuie sa fie o adresa de email valida';
    }

    if(isEmpty(data.password)) errors.password = 'Campul parola nu trebuie sa fie gol';
    if(data.password !== data.confirmPassword) errors.confirmPassword = 'Parolele difera';
    if(isEmpty(data.handle)) errors.handle = 'Campul handle nu trebuie sa fie gol';

    return{
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}

exports.validateLoginData = (data) => {
    let errors = {};
  
    if (isEmpty(data.email)) errors.email = 'Campul nu trebuie sa fie gol';
    if (isEmpty(data.password)) errors.password = 'Campul nu trebuie sa fie gol';
  
    return{
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}

exports.reduceUserDetails = (data) => {
  let userDetails = {};

  if(!isEmpty(data.bio.trim())) userDetails.bio = data.bio;
  if(!isEmpty(data.website.trim()))
  {
    if(data.website.trim().substring(0 , 4) !== 'http')
    {
      userDetails.website = `http://${data.website.trim()}`;
    }
    else userDetails.website = data.website;
  }
  if(!isEmpty(data.location.trim())) userDetails.location = data.location;
  
  return userDetails;
};