import React from 'react';
import styled from 'styled-components';
import { civicIssues } from '../constants/civicIssues';

const Card = () => {
  return (
    <StyledWrapper>
      <div className="container">
        {civicIssues.map((issue) => (
          <div className="card" key={issue.id} style={{ backgroundColor: issue.color }}>
            <div className="card-content">
              <div className="card-icon">{issue.icon}</div>
              <div className="card-title">{issue.title}</div>
              <div className="card-description">{issue.description}</div>
            </div>
          </div>
        ))}
      </div>
    </StyledWrapper>
  );
}


const StyledWrapper = styled.div`
  .container {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    justify-content: center;
    padding: 20px;
  }

  .card {
    background-color: #fff;
    height: 200px;
    width: 250px;
    border-radius: 16px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
  }

  .card-content {
    padding: 20px;
    text-align: center;
  }

  .card-icon {
    font-size: 2.5rem;
    margin-bottom: 10px;
  }

  .card-title {
    font-weight: bold;
    font-size: 1.2rem;
    margin-bottom: 10px;
  }

  .card-description {
    font-size: 0.9rem;
    color: #333;
  }

  .card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }`;

export default Card;
