import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import {
    Title,
    Grid,
    GridItem,
    Modal,
    Button,
    TextInput,
    Card,
    CardBody,
    CardHeader,
    SplitItem,
    Split,
    Dropdown,
    DropdownItem,
    DropdownPosition,
    DropdownToggle
} from '@patternfly/react-core';
import { Skeleton, SkeletonSize } from '../../PresentationalComponents/Skeleton';
import get from 'lodash/get';
import { connect } from 'react-redux';
import ApplicationDetails from './ApplicationDetails';
import { editDisplayName, loadEntity } from '../../redux/actions/inventory';

class EntityDetails extends Component {
    state = {
        isOpen: false,
        isModalOpen: false
    };

    getFact = (path) => {
        const { entity } = this.props;
        return get(entity, path, undefined);
    }

    getAnsibleHost = () => this.getFact('ansible_host') || this.getFact('fqdn') || this.getFact('id');

    toggleActions = (collapsed) => {
        this.setState({
            isOpen: collapsed
        });
    }

    onSelect = () => {
        this.setState({
            isOpen: !this.state.isOpen
        });
    };

    onEntityNameChange = (value) => {
        this.setState({
            displayName: value
        });
    };

    handleModalToggle = (_event, isSubmit) => {
        const { entity, setDisplayName } = this.props;
        const { displayName } = this.state;
        if (isSubmit) {
            setDisplayName(entity.id, displayName || entity.display_name);
        }

        this.setState({
            isModalOpen: !this.state.isModalOpen,
            displayName: undefined
        });
    };

    generateTop = () => {
        const { entity, loaded, actions } = this.props;
        const { isOpen } = this.state;
        return (
            <Split className="ins-c-inventory__detail--header">
                <SplitItem isMain>
                    {
                        loaded ?
                            <Title size='2xl'>{ entity && entity.display_name }</Title> :
                            <Skeleton size={ SkeletonSize.md } />
                    }
                </SplitItem>
                {
                    <SplitItem>
                        {
                            loaded ?
                                <Dropdown
                                    onSelect={ this.onSelect }
                                    toggle={ <DropdownToggle onToggle={ this.toggleActions }>Actions</DropdownToggle> }
                                    isOpen={ isOpen }
                                    position={ DropdownPosition.right }
                                    dropdownItems={ [
                                        <DropdownItem
                                            key="1"
                                            component="button"
                                            onClick={ event => this.handleModalToggle(event) }>
                                            Edit name
                                        </DropdownItem>,
                                        ...(actions ?
                                            actions.map((action, key) => (
                                                <DropdownItem
                                                    key={ action.key || key }
                                                    component="button"
                                                    onClick={ (event) => action.onClick(event, action, action.key || key) }
                                                >
                                                    { action.title }
                                                </DropdownItem>)
                                            ) : []
                                        )
                                    ] }
                                /> :
                                <Skeleton size={ SkeletonSize.xl } />
                        }
                    </SplitItem>
                }
            </Split>
        );
    }

    generateFacts = () => {
        const { loaded } = this.props;
        return (
            <Grid className="ins-entity-facts">
                <GridItem md={ 6 }>
                    <div>
                        <span>
                            Hostname:
                        </span>
                        <span>
                            {
                                loaded ?
                                    this.getFact('fqdn') || ' ' :
                                    <Skeleton size={ SkeletonSize.md } />
                            }
                        </span>
                    </div>
                    <div>
                        <span>
                            Ansible host:
                        </span>
                        <span>
                            {
                                loaded ?
                                    this.getAnsibleHost() :
                                    <Skeleton size={ SkeletonSize.md } />
                            }
                        </span>
                    </div>
                    <div>
                        <span>
                            UUID:
                        </span>
                        <span>
                            {
                                loaded ?
                                    this.getFact(`id`) || ' ' :
                                    <Skeleton size={ SkeletonSize.md } />
                            }
                        </span>
                    </div>
                    <div>
                        <span>
                            Last seen:
                        </span>
                        <span>
                            {
                                loaded ?
                                    (new Date(this.getFact('updated'))).toLocaleString() :
                                    <Skeleton size={ SkeletonSize.sm } />
                            }
                        </span>
                    </div>
                </GridItem>
            </Grid>
        );
    }

    render() {
        const { useCard, entity } = this.props;
        const { isModalOpen, displayName } = this.state;

        return (
            <div className="ins-entity-detail">
                { useCard ?
                    <Card>
                        <CardHeader>
                            { this.generateTop() }
                        </CardHeader>
                        <CardBody>
                            { this.generateFacts() }
                        </CardBody>
                    </Card> :
                    <Fragment>
                        { this.generateTop() }
                        { this.generateFacts() }
                    </Fragment>
                }
                <ApplicationDetails />
                <Modal
                    title="Edit display name"
                    className="ins-c-inventory__detail--edit"
                    isOpen={ isModalOpen }
                    onClose={ (event) => this.handleModalToggle(event, false) }
                    actions={ [
                        <Button key="cancel" variant="secondary" onClick={ (event) => this.handleModalToggle(event, false) }>
                            Cancel
                        </Button>,
                        <Button key="confirm" variant="primary" onClick={ (event) => this.handleModalToggle(event, true) }>
                            Save
                        </Button>
                    ] }
                >
                    <TextInput
                        value={ typeof displayName === 'undefined' ? entity && entity.display_name : displayName }
                        type="text"
                        onChange={ this.onEntityNameChange }
                        aria-label="Host inventory display name"
                    />
                </Modal>
            </div>
        );
    }
}

EntityDetails.propTypes = {
    loaded: PropTypes.bool.isRequired,
    entity: PropTypes.object,
    useCard: PropTypes.bool,
    setDisplayName: PropTypes.func,
    actions: PropTypes.arrayOf(PropTypes.shape({
        title: PropTypes.node,
        onClick: PropTypes.func,
        key: PropTypes.string
    }))
};

EntityDetails.defualtProps = {
    entity: {},
    useCard: false,
    actions: [],
    setDisplayName: () => undefined
};

function mapDispatchToProps(dispatch) {
    return {
        setDisplayName: (id, displayName) => {
            const dispatchEvent = editDisplayName(id, displayName);
            dispatchEvent.payload.then(data => {
                dispatch(loadEntity(id, {
                    hasItems: true
                }));
                return data;
            });
            dispatch(dispatchEvent);
        }
    };
}

export default connect(({ entityDetails }) => ({ ...entityDetails }), mapDispatchToProps)(EntityDetails);
